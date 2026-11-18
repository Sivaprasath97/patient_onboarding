import { lazy } from 'react';

/** Reports & Analytics (SRD §4.12) */
export default {
  id: 'reports',
  path: '/reports',
  label: 'Reports',
  icon: 'analytics',
  perm: 'reports:read',
  routes: [{ path: '/reports', page: lazy(() => import('./pages/ReportsPage.jsx')) }],
};
