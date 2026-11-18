import { api, qs } from '../../../shared/api/client.js';

export const ENTITY_TYPES = [
  { value: 'participant', label: 'Participant', path: '/participants', labelOf: (r) => `${r.participant_code} — ${r.full_name}` },
  { value: 'enrollment', label: 'Enrollment', path: '/enrollments', labelOf: (r) => `${r.participant_code} — ${r.trial_code} (${r.status})` },
  { value: 'visit', label: 'Visit', path: '/visits', labelOf: (r) => `${r.participant_code} — ${r.visit_name} (${r.scheduled_date})` },
  { value: 'assessment', label: 'Medical assessment', path: '/assessments', labelOf: (r) => `${r.participant_code} — ${r.visit_name} (${r.status})` },
  { value: 'adverse_event', label: 'Adverse event', path: '/adverse-events', labelOf: (r) => `${r.ae_code} — ${r.term} (${r.participant_code})` },
];

export const queriesApi = {
  list: (params) => api(`/queries${qs(params)}`),
  summary: () => api('/queries/summary'),
  get: (id) => api(`/queries/${id}`),
  raise: (data) => api('/queries', { method: 'POST', body: data }),
  respond: (id, message) => api(`/queries/${id}/respond`, { method: 'POST', body: { message } }),
  close: (id, message) => api(`/queries/${id}/close`, { method: 'POST', body: { message } }),
  reopen: (id, message) => api(`/queries/${id}/reopen`, { method: 'POST', body: { message } }),
};
