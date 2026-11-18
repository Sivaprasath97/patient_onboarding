// Dropdowns that load records from other modules (trials, participants, enrollments, users).
import { api, qs } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { Select } from '../ui/index.js';

function usePicker(path, params) {
  const key = JSON.stringify(params);
  return useApi(() => api(`${path}${qs({ page_size: 200, ...params })}`), [path, key]);
}

export function TrialPicker({ status, label = 'Trial', placeholder = 'Select a trial…', ...props }) {
  const { data, loading } = usePicker('/trials', { status });
  const options = (data?.items || []).map((t) => ({ value: t.id, label: `${t.trial_code} — ${t.title}` }));
  return <Select label={label} placeholder={loading ? 'Loading…' : placeholder} options={options} {...props} />;
}

export function ParticipantPicker({ status = 'Active', label = 'Participant', placeholder = 'Select a participant…', ...props }) {
  const { data, loading } = usePicker('/participants', { status });
  const options = (data?.items || []).map((p) => ({ value: p.id, label: `${p.participant_code} — ${p.full_name}` }));
  return <Select label={label} placeholder={loading ? 'Loading…' : placeholder} options={options} {...props} />;
}

export function EnrollmentPicker({ status, trialId, label = 'Participant enrollment', placeholder = 'Select participant / trial…', ...props }) {
  const { data, loading } = usePicker('/enrollments', { status, trial_id: trialId });
  const options = (data?.items || []).map((e) => ({
    value: e.id,
    label: `${e.participant_code} ${e.participant_name} — ${e.trial_code} (${e.status})`,
  }));
  return <Select label={label} placeholder={loading ? 'Loading…' : placeholder} options={options} {...props} />;
}

export function UserPicker({ role, label = 'User', placeholder = 'Select a user…', ...props }) {
  const { data, loading } = useApi(() => api(`/users/directory${qs({ role })}`), [role]);
  const options = (data || []).map((u) => ({ value: u.id, label: `${u.name} (${u.role_label})` }));
  return <Select label={label} placeholder={loading ? 'Loading…' : placeholder} options={options} {...props} />;
}

/** Generic record picker by API path. */
export function RecordPicker({ path, params, labelOf, label, placeholder = 'Select…', ...props }) {
  const { data, loading } = usePicker(path, params || {});
  const options = (data?.items || []).map((r) => ({ value: r.id, label: labelOf(r) }));
  return <Select label={label} placeholder={loading ? 'Loading…' : placeholder} options={options} {...props} />;
}
