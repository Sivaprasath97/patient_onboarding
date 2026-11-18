import { lazy } from 'react';

/** Clinical Trial Management + Study Protocol Management (SRD §4.3, §4.6) */
export default {
  id: 'trials',
  path: '/trials',
  label: 'Trials & Protocols',
  icon: 'clinical_notes',
  perm: 'trials:read',
  routes: [
    { path: '/trials', page: lazy(() => import('./pages/TrialsListPage.jsx')) },
    { path: '/trials/:id', page: lazy(() => import('./pages/TrialDetailPage.jsx')) },
  ],
};
