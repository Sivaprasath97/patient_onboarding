import { lazy } from 'react';

/** User Management (SRD §4.1) — admins only */
export default {
  id: 'user-management',
  path: '/users',
  label: 'User Management',
  icon: 'admin_panel_settings',
  perm: 'users:manage',
  routes: [{ path: '/users', page: lazy(() => import('./pages/UsersPage.jsx')) }],
};
