import { api, qs } from '../../../shared/api/client.js';

export const SEXES = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const participantsApi = {
  list: (params) => api(`/participants${qs(params)}`),
  get: (id) => api(`/participants/${id}`),
  create: (data) => api('/participants', { method: 'POST', body: data }),
  update: (id, data) => api(`/participants/${id}`, { method: 'PATCH', body: data }),
  withdraw: (id, reason) => api(`/participants/${id}/withdraw`, { method: 'POST', body: { reason } }),
};
