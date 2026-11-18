import { lazy } from 'react';

/** Participant / Patient Management (SRD §4.4) */
export default {
  id: 'participants',
  path: '/participants',
  label: 'Participants',
  icon: 'groups',
  perm: 'participants:read',
  routes: [
    { path: '/participants', page: lazy(() => import('./pages/ParticipantsListPage.jsx')) },
    { path: '/participants/:id', page: lazy(() => import('./pages/ParticipantDetailPage.jsx')) },
  ],
};
