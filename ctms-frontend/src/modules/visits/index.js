import { lazy } from 'react';

/** Visit & Appointment Management (SRD §4.7) */
export default {
  id: 'visits',
  path: '/visits',
  label: 'Visits & Calendar',
  icon: 'calendar_month',
  perm: 'visits:read',
  routes: [{ path: '/visits', page: lazy(() => import('./pages/VisitsPage.jsx')) }],
};
