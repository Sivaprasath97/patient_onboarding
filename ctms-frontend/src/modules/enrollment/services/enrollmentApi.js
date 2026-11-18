import { api, qs } from '../../../shared/api/client.js';

export const ENROLLMENT_STATUSES = ['Screening', 'Enrolled', 'Screen Failed', 'Withdrawn', 'Completed'];
export const CONSENT_STATUSES = ['Pending', 'Signed', 'Declined', 'Withdrawn'];

export const enrollmentApi = {
  list: (params) => api(`/enrollments${qs(params)}`),
  summary: (params) => api(`/enrollments/summary${qs(params)}`),
  get: (id) => api(`/enrollments/${id}`),
  startScreening: (data) => api('/enrollments', { method: 'POST', body: data }),
  eligibility: (id, answers, notes) => api(`/enrollments/${id}/eligibility`, { method: 'PUT', body: { answers, notes } }),
  consent: (id, data) => api(`/enrollments/${id}/consent`, { method: 'PUT', body: data }),
  enroll: (id, data) => api(`/enrollments/${id}/enroll`, { method: 'POST', body: data }),
  screenFail: (id, reason) => api(`/enrollments/${id}/screen-fail`, { method: 'POST', body: { reason } }),
  withdraw: (id, reason) => api(`/enrollments/${id}/withdraw`, { method: 'POST', body: { reason } }),
  complete: (id) => api(`/enrollments/${id}/complete`, { method: 'POST' }),
};
