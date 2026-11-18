// In-browser data store for mock mode (localStorage). Not secure — demo/testing only.
const KEY = 'ctms_mock_db_v1';
export const DEMO_PASSWORD = 'Demo@1234';

export const DEMO_USERS = [
  { full_name: 'Asha Admin', email: 'admin@ctms.demo', role: 'admin', site: 'CTMS Head Office' },
  { full_name: 'Dr. Priya Raman', email: 'pi@ctms.demo', role: 'principal_investigator', site: 'City Research Hospital' },
  { full_name: 'Karthik Coordinator', email: 'coordinator@ctms.demo', role: 'research_coordinator', site: 'City Research Hospital' },
  { full_name: 'Meena Monitor', email: 'cra@ctms.demo', role: 'cra', site: 'Sponsor CRO' },
  { full_name: 'Daniel Data', email: 'datamanager@ctms.demo', role: 'data_manager', site: 'Sponsor CRO' },
];

export const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(16).slice(2) + Date.now().toString(16));
export const nowIso = () => new Date().toISOString();

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt = uid()) {
  return `${salt}$${await sha256(`${salt}:${password}`)}`;
}

export async function verifyPassword(password, stored) {
  const [salt] = (stored || '').split('$');
  return (await hashPassword(password, salt)) === stored;
}

let cache = null;

export function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  return cache;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked — keep in memory */
  }
}

export async function ensureSeeded() {
  if (load()) return cache;
  const users = [];
  for (const u of DEMO_USERS) {
    users.push({
      id: uid(), ...u, phone: null, is_active: true, password_hash: await hashPassword(DEMO_PASSWORD),
      failed_attempts: 0, locked_until: null, created_at: nowIso(), updated_at: nowIso(), last_login_at: null,
    });
  }
  cache = { users, sessions: {}, reset_tokens: {}, audit: [], notifications: [] };
  save();
  return cache;
}

/** Wipe all mock data (used by the "Reset demo data" action). */
export function resetMockDb() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
