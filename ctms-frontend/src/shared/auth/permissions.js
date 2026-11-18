// Role → permission matrix (SRD §3, §4.1). Single source of truth for the frontend:
// used by the mock API and by the "Roles & permissions" screen. A real backend must enforce the same rules.

export const ROLES = [
  { value: 'admin', label: 'System Administrator' },
  { value: 'principal_investigator', label: 'Principal Investigator' },
  { value: 'research_coordinator', label: 'Research Coordinator' },
  { value: 'cra', label: 'Clinical Research Associate' },
  { value: 'data_manager', label: 'Data Manager' },
];
export const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));
export const SELF_REGISTER_ROLES = ROLES.filter((r) => r.value !== 'admin');

const A = 'admin';
const PI = 'principal_investigator';
const RC = 'research_coordinator';
const CRA = 'cra';
const DM = 'data_manager';
const ALL = [A, PI, RC, CRA, DM];
const CLINICAL = [PI, RC, CRA, DM];

/** [permission, description, roles] grouped by module, in display order. */
export const PERMISSION_GROUPS = [
  ['User management', [['users:manage', 'Create, edit and deactivate user accounts', [A]]]],
  ['Trials & protocols', [
    ['trials:read', 'View trials', ALL],
    ['trials:write', 'Create / edit trials, change status', [A, PI]],
    ['protocols:write', 'Create and activate protocol versions', [A, PI]],
    ['deviations:write', 'Report and resolve protocol deviations', [PI, RC, CRA]],
  ]],
  ['Participants & enrollment', [
    ['participants:read', 'View participants and enrollments', ALL],
    ['participants:write', 'Register / edit / withdraw participants', [PI, RC]],
    ['enrollment:write', 'Screening, eligibility, consent, enrollment', [PI, RC]],
  ]],
  ['Visits', [
    ['visits:read', 'View visits and calendar', ALL],
    ['visits:write', 'Schedule, complete, reschedule visits', [PI, RC]],
  ]],
  ['Medical assessments', [
    ['assessments:read', 'View medical data (not admins)', CLINICAL],
    ['assessments:write', 'Record vitals, labs, observations', [PI, RC]],
    ['assessments:finalize', 'Finalize assessments', [PI]],
  ]],
  ['Adverse events', [
    ['ae:read', 'View adverse events', ALL],
    ['ae:write', 'Report and update adverse events', [PI, RC]],
    ['ae:review', 'PI review, causality, close', [PI]],
  ]],
  ['Data queries', [
    ['queries:read', 'View data queries', ALL],
    ['queries:raise', 'Raise / reopen queries', [PI, CRA, DM]],
    ['queries:respond', 'Respond to queries', [PI, RC]],
    ['queries:close', 'Close queries', [CRA, DM]],
  ]],
  ['Documents', [
    ['documents:read', 'View and download documents', ALL],
    ['documents:write', 'Upload documents and new versions', [A, PI, RC, CRA]],
  ]],
  ['Reports & audit', [
    ['reports:read', 'Generate and export reports', ALL],
    ['audit:read', 'View audit logs', [A, CRA, DM]],
  ]],
];

export const PERMISSIONS = Object.fromEntries(PERMISSION_GROUPS.flatMap(([, perms]) => perms.map(([p, , roles]) => [p, roles])));

export const permissionsFor = (role) => Object.keys(PERMISSIONS).filter((p) => PERMISSIONS[p].includes(role)).sort();
