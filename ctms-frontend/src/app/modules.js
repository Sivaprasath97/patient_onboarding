// Module registry: the order here is the sidebar order.
// To add a module: create src/modules/<name>/index.js ({ id, path, label, icon, perm, routes }) and register it below.
import dashboard from '../modules/dashboard/index.js';
import trials from '../modules/trials/index.js';
import participants from '../modules/participants/index.js';
import enrollment from '../modules/enrollment/index.js';
import visits from '../modules/visits/index.js';
import assessments from '../modules/assessments/index.js';
import adverseEvents from '../modules/adverse-events/index.js';
import dataQueries from '../modules/data-queries/index.js';
import documents from '../modules/documents/index.js';
import reports from '../modules/reports/index.js';
import auditLogs from '../modules/audit-logs/index.js';
import userManagement from '../modules/user-management/index.js';

export const MODULES = [
  dashboard,
  trials,
  participants,
  enrollment,
  visits,
  assessments,
  adverseEvents,
  dataQueries,
  documents,
  reports,
  auditLogs,
  userManagement,
];
