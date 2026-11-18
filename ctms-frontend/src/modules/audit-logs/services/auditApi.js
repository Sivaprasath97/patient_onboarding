import { api, qs } from '../../../shared/api/client.js';

export const auditApi = {
  list: (params) => api(`/audit-logs${qs(params)}`),
  facets: () => api('/audit-logs/facets'),
};
