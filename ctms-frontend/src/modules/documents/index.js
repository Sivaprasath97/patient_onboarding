import { lazy } from 'react';

/** Document Management (SRD §4.11) */
export default {
  id: 'documents',
  path: '/documents',
  label: 'Documents',
  icon: 'description',
  perm: 'documents:read',
  routes: [{ path: '/documents', page: lazy(() => import('./pages/DocumentsPage.jsx')) }],
};
