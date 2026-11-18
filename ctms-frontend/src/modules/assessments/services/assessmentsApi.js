import { api, qs } from '../../../shared/api/client.js';

export const assessmentsApi = {
  list: (params) => api(`/assessments${qs(params)}`),
  get: (id) => api(`/assessments/${id}`),
  create: (data) => api('/assessments', { method: 'POST', body: data }),
  update: (id, data) => api(`/assessments/${id}`, { method: 'PUT', body: data }),
  finalize: (id) => api(`/assessments/${id}/finalize`, { method: 'POST' }),
};
