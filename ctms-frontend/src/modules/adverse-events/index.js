import { lazy } from 'react';

/** Adverse Event Management (SRD §4.9) */
export default {
  id: 'adverse-events',
  path: '/adverse-events',
  label: 'Adverse Events',
  icon: 'warning',
  danger: true,
  perm: 'ae:read',
  routes: [
    { path: '/adverse-events', page: lazy(() => import('./pages/AEListPage.jsx')) },
    { path: '/adverse-events/:id', page: lazy(() => import('./pages/AEDetailPage.jsx')) },
  ],
};
