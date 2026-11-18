/**
 * Mock API (VITE_USE_MOCK=true). Implements the same endpoints/JSON shapes the real backend
 * must provide for Phase 0–1 (auth + user management). Other modules return 501 in mock mode.
 */
import { ApiError } from '../errors.js';
import { PERMISSIONS, ROLE_LABELS, SELF_REGISTER_ROLES, permissionsFor } from '../../auth/permissions.js';
import { ensureSeeded, hashPassword, nowIso, save, uid, verifyPassword } from './db.js';

const SESSION_HOURS = 8;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bad = (msg, fieldErrors) => new ApiError(fieldErrors ? 422 : 400, msg, fieldErrors);
const fieldError = (field, msg) => new ApiError(422, `Please check the form: ${msg}`, { [field]: msg });

function checkPassword(pw, field = 'password') {
  if (!pw || pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    throw fieldError(field, 'Password must be at least 8 characters with letters and numbers');
  }
}

function userOut(u) {
  return {
    id: u.id, full_name: u.full_name, email: u.email, role: u.role, role_label: ROLE_LABELS[u.role],
    phone: u.phone || null, site: u.site || null, is_active: u.is_active, created_at: u.created_at,
    last_login_at: u.last_login_at, locked: !!(u.locked_until && new Date(u.locked_until) > new Date()),
    permissions: permissionsFor(u.role),
  };
}

function audit(db, action, user, extra = {}) {
  db.audit.unshift({
    id: uid(), action, user_id: user?.id || null, user_name: user?.full_name || null, email: user?.email || extra.email || null,
    timestamp: nowIso(), ...extra,
  });
  db.audit = db.audit.slice(0, 2000);
}

function startSession(db, user) {
  const token = uid() + uid();
  db.sessions[token] = { user_id: user.id, exp: Date.now() + SESSION_HOURS * 3600e3 };
  user.last_login_at = nowIso();
  user.failed_attempts = 0;
  user.locked_until = null;
  return { access_token: token, token_type: 'bearer', expires_in: SESSION_HOURS * 3600, user: userOut(user) };
}

function currentUser(db, token) {
  const s = token && db.sessions[token];
  if (!s || s.exp < Date.now()) throw new ApiError(401, 'Not authenticated');
  const u = db.users.find((x) => x.id === s.user_id);
  if (!u || !u.is_active) throw new ApiError(401, 'Not authenticated');
  return u;
}

function requirePerm(user, perm) {
  if (!PERMISSIONS[perm]?.includes(user.role)) throw new ApiError(403, "You don't have permission to do this");
}

function findUser(db, id) {
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new ApiError(404, 'User not found');
  return u;
}

function cleanText(v, max) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

// ---------------------------------------------------------------------------------------------

const routes = [
  // ----- Auth -----
  ['GET', '/auth/roles', () => SELF_REGISTER_ROLES.map((r) => ({ value: r.value, label: r.label }))],

  ['POST', '/auth/register', async ({ db, body }) => {
    const full_name = cleanText(body.full_name, 100);
    const email = (body.email || '').trim().toLowerCase();
    if (!full_name || full_name.length < 2) throw fieldError('full_name', 'Enter your full name');
    if (!EMAIL_RE.test(email)) throw fieldError('email', 'Enter a valid email address');
    checkPassword(body.password);
    if (!SELF_REGISTER_ROLES.some((r) => r.value === body.role)) throw fieldError('role', 'This role cannot be self-registered');
    if (db.users.some((u) => u.email === email)) throw new ApiError(409, 'An account with this email already exists');
    const user = {
      id: uid(), full_name, email, role: body.role, phone: cleanText(body.phone, 20), site: cleanText(body.site, 120),
      is_active: true, password_hash: await hashPassword(body.password), failed_attempts: 0, locked_until: null,
      created_at: nowIso(), updated_at: nowIso(), last_login_at: null,
    };
    db.users.push(user);
    audit(db, 'user.register', user, { details: { role: user.role } });
    db.notifications.unshift({ id: uid(), user_id: user.id, title: 'Welcome to CTMS Portal', message: `Your ${ROLE_LABELS[user.role]} account is ready.`, kind: 'info', read: false, created_at: nowIso(), link: '/profile' });
    return startSession(db, user);
  }, 201],

  ['POST', '/auth/login', async ({ db, body }) => {
    const email = (body.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email === email);
    const generic = new ApiError(401, 'Invalid email or password');
    if (!user) {
      audit(db, 'user.login_failed', null, { email });
      throw generic;
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new ApiError(423, `Account temporarily locked after too many failed attempts. Try again in ${mins} minute(s) or reset your password.`);
    }
    if (!(await verifyPassword(body.password || '', user.password_hash))) {
      user.failed_attempts = (user.failed_attempts || 0) + 1;
      if (user.failed_attempts >= MAX_FAILED) {
        user.locked_until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
        user.failed_attempts = 0;
        audit(db, 'user.locked', user);
        throw new ApiError(423, `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`);
      }
      audit(db, 'user.login_failed', user);
      throw generic;
    }
    if (!user.is_active) throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
    audit(db, 'user.login', user);
    return startSession(db, user);
  }],

  ['GET', '/auth/me', ({ me }) => userOut(me), 200, true],

  ['PATCH', '/auth/me', ({ db, me, body }) => {
    if ('full_name' in body) {
      const n = cleanText(body.full_name, 100);
      if (!n || n.length < 2) throw fieldError('full_name', 'Enter your full name');
      me.full_name = n;
    }
    if ('phone' in body) me.phone = cleanText(body.phone, 20);
    if ('site' in body) me.site = cleanText(body.site, 120);
    me.updated_at = nowIso();
    audit(db, 'user.profile_update', me);
    return userOut(me);
  }, 200, true],

  ['POST', '/auth/change-password', async ({ db, me, body }) => {
    if (!(await verifyPassword(body.current_password || '', me.password_hash))) throw fieldError('current_password', 'Current password is incorrect');
    checkPassword(body.new_password, 'new_password');
    if (body.new_password === body.current_password) throw fieldError('new_password', 'New password must be different from the current one');
    me.password_hash = await hashPassword(body.new_password);
    me.updated_at = nowIso();
    audit(db, 'user.password_change', me);
    return null;
  }, 204, true],

  ['POST', '/auth/logout', ({ db, me, token }) => {
    delete db.sessions[token];
    audit(db, 'user.logout', me);
    return null;
  }, 204, true],

  ['POST', '/auth/forgot-password', ({ db, body }) => {
    const email = (body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw fieldError('email', 'Enter a valid email address');
    const user = db.users.find((u) => u.email === email && u.is_active);
    const res = { message: 'If an account exists for this email, a password reset link has been sent.' };
    if (user) {
      const token = uid() + uid();
      db.reset_tokens[token] = { user_id: user.id, exp: Date.now() + RESET_MINUTES * 60000, used: false };
      audit(db, 'user.password_reset_requested', user);
      // Mock only: there is no email service, so the link is returned for the demo.
      res.demo_reset_link = `/reset-password?token=${token}`;
    }
    return res;
  }],

  ['GET', '/auth/reset-password/:token', ({ db, params }) => {
    const t = db.reset_tokens[params.token];
    if (!t || t.used || t.exp < Date.now()) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
    const u = findUser(db, t.user_id);
    const [name, domain] = u.email.split('@');
    return { email: `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}` };
  }],

  ['POST', '/auth/reset-password', async ({ db, body }) => {
    const t = db.reset_tokens[body.token];
    if (!t || t.used || t.exp < Date.now()) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
    checkPassword(body.password);
    const u = findUser(db, t.user_id);
    u.password_hash = await hashPassword(body.password);
    u.failed_attempts = 0;
    u.locked_until = null;
    u.updated_at = nowIso();
    t.used = true;
    Object.keys(db.sessions).forEach((k) => db.sessions[k].user_id === u.id && delete db.sessions[k]); // sign out everywhere
    audit(db, 'user.password_reset', u);
    return null;
  }, 204],

  // ----- Users (admin) -----
  ['GET', '/users/directory', ({ db, query }) =>
    db.users.filter((u) => u.is_active && (!query.role || u.role === query.role))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((u) => ({ id: u.id, name: u.full_name, email: u.email, role: u.role, role_label: ROLE_LABELS[u.role] })), 200, true],

  ['GET', '/users', ({ db, me, query }) => {
    requirePerm(me, 'users:manage');
    const q = (query.q || '').toLowerCase();
    let rows = db.users.filter((u) =>
      (!q || u.full_name.toLowerCase().includes(q) || u.email.includes(q)) &&
      (!query.role || u.role === query.role) &&
      (query.active === undefined || query.active === '' || String(u.is_active) === query.active));
    rows = rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
    const page = Math.max(1, +query.page || 1);
    const size = Math.min(200, +query.page_size || 20);
    return { items: rows.slice((page - 1) * size, page * size).map(userOut), total: rows.length, page, page_size: size };
  }, 200, true],

  ['POST', '/users', async ({ db, me, body }) => {
    requirePerm(me, 'users:manage');
    const full_name = cleanText(body.full_name, 100);
    const email = (body.email || '').trim().toLowerCase();
    if (!full_name || full_name.length < 2) throw fieldError('full_name', 'Enter a full name');
    if (!EMAIL_RE.test(email)) throw fieldError('email', 'Enter a valid email address');
    if (!ROLE_LABELS[body.role]) throw fieldError('role', 'Select a role');
    checkPassword(body.password);
    if (db.users.some((u) => u.email === email)) throw new ApiError(409, 'An account with this email already exists');
    const user = {
      id: uid(), full_name, email, role: body.role, phone: cleanText(body.phone, 20), site: cleanText(body.site, 120),
      is_active: true, password_hash: await hashPassword(body.password), failed_attempts: 0, locked_until: null,
      created_at: nowIso(), updated_at: nowIso(), last_login_at: null,
    };
    db.users.push(user);
    audit(db, 'user.create', me, { entity_type: 'user', entity_id: user.id, entity_label: email });
    return userOut(user);
  }, 201, true],

  ['PATCH', '/users/:id', ({ db, me, body, params }) => {
    requirePerm(me, 'users:manage');
    const u = findUser(db, params.id);
    if (u.id === me.id && (body.is_active === false || (body.role && body.role !== 'admin'))) {
      throw bad("You can't deactivate your own account or remove your own admin role");
    }
    const changes = {};
    if ('full_name' in body) {
      const n = cleanText(body.full_name, 100);
      if (!n || n.length < 2) throw fieldError('full_name', 'Enter a full name');
      changes.full_name = n;
    }
    if ('role' in body) {
      if (!ROLE_LABELS[body.role]) throw fieldError('role', 'Select a role');
      changes.role = body.role;
    }
    if ('phone' in body) changes.phone = cleanText(body.phone, 20);
    if ('site' in body) changes.site = cleanText(body.site, 120);
    if ('is_active' in body) changes.is_active = !!body.is_active;
    const diff = Object.fromEntries(Object.entries(changes).filter(([k, v]) => u[k] !== v).map(([k, v]) => [k, { from: u[k], to: v }]));
    Object.assign(u, changes, { updated_at: nowIso() });
    if (changes.is_active === false) Object.keys(db.sessions).forEach((k) => db.sessions[k].user_id === u.id && delete db.sessions[k]);
    if (changes.is_active === true) { u.locked_until = null; u.failed_attempts = 0; }
    audit(db, changes.is_active === false ? 'user.deactivate' : changes.is_active === true ? 'user.activate' : 'user.update', me,
      { entity_type: 'user', entity_id: u.id, entity_label: u.email, changes: diff });
    return userOut(u);
  }, 200, true],

  ['POST', '/users/:id/reset-password', async ({ db, me, body, params }) => {
    requirePerm(me, 'users:manage');
    const u = findUser(db, params.id);
    checkPassword(body.password);
    u.password_hash = await hashPassword(body.password);
    u.locked_until = null;
    u.failed_attempts = 0;
    u.updated_at = nowIso();
    audit(db, 'user.password_reset', me, { entity_type: 'user', entity_id: u.id, entity_label: u.email });
    return null;
  }, 204, true],

  // ----- Shell data used on every page (later phases fill these in) -----
  ['GET', '/dashboard', () => ({
    trials: { total: 0, by_status: {} },
    participants: { total: 0, active: 0 },
    enrollment: { by_status: {}, by_trial: [], trend: lastMonths().map((month) => ({ month, count: 0 })) },
    visits: { upcoming: [], overdue: 0, today: 0 },
    safety: { open_aes: 0, open_saes: 0 },
    queries: { open: 0, answered: 0 },
    tasks: [],
    activity: [],
  }), 200, true],

  ['GET', '/notifications', ({ db, me }) => {
    const items = db.notifications.filter((n) => n.user_id === me.id).slice(0, 30);
    return { items, unread: items.filter((n) => !n.read).length, alerts: [] };
  }, 200, true],
  ['POST', '/notifications/read-all', ({ db, me }) => {
    db.notifications.forEach((n) => n.user_id === me.id && (n.read = true));
    return null;
  }, 204, true],
  ['POST', '/notifications/:id/read', ({ db, me, params }) => {
    const n = db.notifications.find((x) => x.id === params.id && x.user_id === me.id);
    if (n) n.read = true;
    return null;
  }, 204, true],
];

function lastMonths() {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 6; i++) {
    out.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

const compiled = routes.map(([method, pattern, handler, status = 200, auth = false]) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  return { method, re, keys, handler, status, auth };
});

/** Entry point used by shared/api/client.js in mock mode. Returns { status, data }. */
export async function mockRequest(path, { method = 'GET', body, token } = {}) {
  await sleep(150 + Math.random() * 200);
  const db = await ensureSeeded();
  const [pathname, search = ''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  for (const r of compiled) {
    if (r.method !== method) continue;
    const m = r.re.exec(pathname);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const me = r.auth ? currentUser(db, token) : null;
    try {
      const data = await r.handler({ db, me, body: body || {}, query, params, token });
      return { status: r.status, data };
    } finally {
      save();
    }
  }
  throw new ApiError(501, 'This module needs the backend API — it is not available in mock mode yet.');
}
