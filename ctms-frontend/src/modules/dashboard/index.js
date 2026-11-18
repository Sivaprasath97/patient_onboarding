import { lazy } from 'react';

/** Dashboard & Analytics (SRD §4.2) */
export default {
  id: 'dashboard',
  path: '/',
  label: 'Dashboard',
  icon: 'dashboard',
  routes: [{ path: '/', page: lazy(() => import('./pages/DashboardPage.jsx')) }],
};
