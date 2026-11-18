import { api, download, qs, upload } from '../../../shared/api/client.js';

export const documentsApi = {
  meta: () => api('/documents/meta'),
  list: (params) => api(`/documents${qs(params)}`),
  versions: (id) => api(`/documents/${id}/versions`),
  upload: (formData) => upload('/documents', formData),
  download: (doc) => download(`/documents/${doc.id}/download`, doc.filename),
};
