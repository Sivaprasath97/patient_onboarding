import { api, qs } from '../../../shared/api/client.js';

export const VISIT_STATUSES = ['Scheduled', 'Completed', 'Missed', 'Cancelled'];

export const visitsApi = {
  list: (params) => api(`/visits${qs(params)}`),
  summary: (params) => api(`/visits/summary${qs(params)}`),
  get: (id) => api(`/visits/${id}`),
  create: (data) => api('/visits', { method: 'POST', body: data }),
  reschedule: (id, data) => api(`/visits/${id}/reschedule`, { method: 'POST', body: data }),
  complete: (id, data) => api(`/visits/${id}/complete`, { method: 'POST', body: data }),
  cancel: (id, reason) => api(`/visits/${id}/cancel`, { method: 'POST', body: { reason } }),
  missed: (id, reason) => api(`/visits/${id}/missed`, { method: 'POST', body: { reason } }),
};
