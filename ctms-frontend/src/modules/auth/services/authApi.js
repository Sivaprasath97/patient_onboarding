import { api } from '../../../shared/api/client.js';

/**
 * Auth endpoints (backend contract for Phase 1):
 *   GET  /auth/roles                      self-registrable roles
 *   POST /auth/register                   -> { access_token, expires_in, user }
 *   POST /auth/login                      -> { access_token, expires_in, user }   (401 invalid, 423 locked, 403 deactivated)
 *   GET  /auth/me | PATCH /auth/me        current user / update own profile
 *   POST /auth/change-password            { current_password, new_password } -> 204
 *   POST /auth/logout                     -> 204
 *   POST /auth/forgot-password            { email } -> { message }   (always 200; emails a reset link)
 *   GET  /auth/reset-password/:token      validate link -> { email (masked) }
 *   POST /auth/reset-password             { token, password } -> 204
 */
export const authApi = {
  roles: () => api('/auth/roles', { auth: false }),
  register: (data) => api('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => api('/auth/me'),
  updateMe: (data) => api('/auth/me', { method: 'PATCH', body: data }),
  changePassword: (current_password, new_password) => api('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  checkResetToken: (token) => api(`/auth/reset-password/${encodeURIComponent(token)}`, { auth: false }),
  resetPassword: (token, password) => api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
};

/** Same rule as the backend: ≥ 8 chars with at least one letter and one number. */
export function passwordError(pw) {
  if (!pw) return 'Enter a password';
  if (pw.length < 8) return 'At least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number';
  return null;
}
