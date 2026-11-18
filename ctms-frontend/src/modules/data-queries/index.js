import { lazy } from 'react';

/** Clinical Data Management — data queries (SRD §4.10) */
export default {
  id: 'data-queries',
  path: '/queries',
  label: 'Data Queries',
  icon: 'help_center',
  perm: 'queries:read',
  routes: [{ path: '/queries', page: lazy(() => import('./pages/QueriesPage.jsx')) }],
};
