import { api, qs } from '../../../shared/api/client.js';

export const PHASES = ['Early Phase I', 'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Not Applicable'];
export const STUDY_TYPES = ['Interventional', 'Observational', 'Expanded Access'];
export const TRIAL_STATUSES = ['Draft', 'Planned', 'Active', 'Suspended', 'Completed', 'Terminated'];
export const TRANSITIONS = {
  Draft: ['Planned', 'Terminated'],
  Planned: ['Draft', 'Active', 'Terminated'],
  Active: ['Suspended', 'Completed', 'Terminated'],
  Suspended: ['Active', 'Terminated'],
  Completed: [],
  Terminated: [],
};

export const trialsApi = {
  list: (params) => api(`/trials${qs(params)}`),
  get: (id) => api(`/trials/${id}`),
  create: (data) => api('/trials', { method: 'POST', body: data }),
  update: (id, data) => api(`/trials/${id}`, { method: 'PATCH', body: data }),
  changeStatus: (id, status, reason) => api(`/trials/${id}/status`, { method: 'POST', body: { status, reason } }),
  protocols: (id) => api(`/trials/${id}/protocols`),
  createProtocol: (id, data) => api(`/trials/${id}/protocols`, { method: 'POST', body: data }),
  updateProtocol: (id, pid, data) => api(`/trials/${id}/protocols/${pid}`, { method: 'PUT', body: data }),
  activateProtocol: (id, pid) => api(`/trials/${id}/protocols/${pid}/activate`, { method: 'POST' }),
  deviations: (id) => api(`/trials/${id}/deviations`),
  createDeviation: (id, data) => api(`/trials/${id}/deviations`, { method: 'POST', body: data }),
  resolveDeviation: (id, did, resolution) => api(`/trials/${id}/deviations/${did}/resolve`, { method: 'POST', body: { resolution } }),
};
