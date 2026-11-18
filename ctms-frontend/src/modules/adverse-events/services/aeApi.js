import { api, qs } from '../../../shared/api/client.js';

export const aeApi = {
  meta: () => api('/adverse-events/meta'),
  list: (params) => api(`/adverse-events${qs(params)}`),
  summary: (params) => api(`/adverse-events/summary${qs(params)}`),
  get: (id) => api(`/adverse-events/${id}`),
  create: (data) => api('/adverse-events', { method: 'POST', body: data }),
  update: (id, data) => api(`/adverse-events/${id}`, { method: 'PATCH', body: data }),
  followUp: (id, data) => api(`/adverse-events/${id}/follow-ups`, { method: 'POST', body: data }),
  review: (id, data) => api(`/adverse-events/${id}/review`, { method: 'POST', body: data }),
  close: (id, data) => api(`/adverse-events/${id}/close`, { method: 'POST', body: data }),
};
