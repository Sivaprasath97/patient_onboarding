// Small fetch wrapper shared by all modules.
// With VITE_USE_MOCK=true (see .env.development) requests are served by the in-browser mock API instead.
import { ApiError } from './errors.js';

export { ApiError };
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TOKEN_KEY = 'ctms_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function parseError(status, body) {
  const detail = body?.detail;
  if (Array.isArray(detail)) {
    // FastAPI/Pydantic validation errors
    const fieldErrors = {};
    for (const err of detail) {
      const field = err.loc?.[err.loc.length - 1];
      if (field && !fieldErrors[field]) fieldErrors[field] = err.msg.replace(/^Value error, /, '');
    }
    const first = Object.values(fieldErrors)[0];
    return new ApiError(status, first ? `Please check the form: ${first}` : 'Please correct the highlighted fields.', fieldErrors);
  }
  if (typeof detail === 'string') return new ApiError(status, detail);
  if (status >= 500 || status === 0) return new ApiError(status, 'The server is unavailable. Please try again.');
  return new ApiError(status, `Request failed (${status})`);
}

/** Build a query string, skipping empty values. */
export function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function request(path, { method = 'GET', body, auth = true, form } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (res.status === 401 && auth) window.dispatchEvent(new Event('ctms:unauthorized'));
    throw parseError(res.status, data);
  }
  return res;
}

async function mockApi(path, { method = 'GET', body, auth = true, form } = {}) {
  const { mockRequest } = await import('./mock/index.js');
  if (form) throw new ApiError(501, 'File uploads need the backend API — not available in mock mode.');
  try {
    const { data } = await mockRequest(path, { method, body, token: auth ? tokenStore.get() : null });
    return data;
  } catch (err) {
    if (err.status === 401 && auth) window.dispatchEvent(new Event('ctms:unauthorized'));
    throw err;
  }
}

export async function api(path, opts) {
  if (USE_MOCK) return mockApi(path, opts);
  const res = await request(path, opts);
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

/** Multipart upload (FormData). */
export function upload(path, formData) {
  return api(path, { method: 'POST', form: formData });
}

/** Authenticated file download -> browser "save as". */
export async function download(path, fallbackName = 'download') {
  if (USE_MOCK) throw new ApiError(501, 'File downloads need the backend API — not available in mock mode.');
  const res = await request(path);
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/.exec(cd);
  const name = m ? decodeURIComponent(m[1] || m[2]) : fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
