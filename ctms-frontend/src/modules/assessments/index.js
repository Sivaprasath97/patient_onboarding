import { lazy } from 'react';

/** Medical Assessment Management (SRD §4.8) — restricted to clinical roles. */
export default {
  id: 'assessments',
  path: '/assessments',
  label: 'Medical Assessment',
  icon: 'stethoscope',
  perm: 'assessments:read',
  routes: [
    { path: '/assessments', page: lazy(() => import('./pages/AssessmentsListPage.jsx')) },
    { path: '/assessments/new', page: lazy(() => import('./pages/AssessmentFormPage.jsx')) },
    { path: '/assessments/:id', page: lazy(() => import('./pages/AssessmentFormPage.jsx')) },
  ],
};
