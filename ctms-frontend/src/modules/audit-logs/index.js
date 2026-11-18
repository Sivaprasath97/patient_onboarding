import { lazy } from 'react';

/** Audit Logs & Activity Tracking (SRD §4.14) */
export default {
  id: 'audit-logs',
  path: '/audit-logs',
  label: 'Audit Logs',
  icon: 'history',
  perm: 'audit:read',
  routes: [{ path: '/audit-logs', page: lazy(() => import('./pages/AuditLogsPage.jsx')) }],
};
