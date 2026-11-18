import { lazy } from 'react';

/** Participant Enrollment (SRD §4.5): screening, eligibility, consent, enrollment */
export default {
  id: 'enrollment',
  path: '/enrollment',
  label: 'Enrollment',
  icon: 'how_to_reg',
  perm: 'participants:read',
  routes: [
    { path: '/enrollment', page: lazy(() => import('./pages/EnrollmentListPage.jsx')) },
    { path: '/enrollment/:id', page: lazy(() => import('./pages/EnrollmentDetailPage.jsx')) },
  ],
};
