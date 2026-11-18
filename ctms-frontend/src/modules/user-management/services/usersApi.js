import { api, qs } from '../../../shared/api/client.js';

export { ROLES } from '../../../shared/auth/permissions.js';

/**
 * User management endpoints (backend contract, admin only — `users:manage`):
 *   GET   /users?q&role&active&page&page_size   -> { items, total, page, page_size }
 *   POST  /users                                -> user
 *   PATCH /users/:id                            { full_name?, role?, phone?, site?, is_active? } -> user
 *   POST  /users/:id/reset-password             { password } -> 204 (also unlocks the account)
 *   GET   /users/directory?role                 active users for pickers (any signed-in user)
 */
export const usersApi = {
  list: (params) => api(`/users${qs(params)}`),
  create: (data) => api('/users', { method: 'POST', body: data }),
  update: (id, data) => api(`/users/${id}`, { method: 'PATCH', body: data }),
  resetPassword: (id, password) => api(`/users/${id}/reset-password`, { method: 'POST', body: { password } }),
};
