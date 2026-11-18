import { api, download, qs } from '../../../shared/api/client.js';

export const reportsApi = {
  list: () => api('/reports'),
  get: (type, params) => api(`/reports/${type}${qs(params)}`),
  export: (type, format, params) => download(`/reports/${type}/export${qs({ ...params, format })}`, `${type}.${format}`),
};
