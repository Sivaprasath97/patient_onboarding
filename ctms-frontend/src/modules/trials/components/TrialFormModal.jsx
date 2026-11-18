import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/client.js';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { Field, FormModal, Input, Select, TextArea, useToast } from '../../../shared/ui/index.js';
import { PHASES, STUDY_TYPES, trialsApi } from '../services/trialsApi.js';

const EMPTY = {
  title: '', description: '', objectives: '', phase: '', study_type: '', therapeutic_area: '', sponsor: '',
  start_date: '', end_date: '', target_enrollment: '', pi_id: '', team_ids: [],
};

export default function TrialFormModal({ open, onClose, trial, onSaved }) {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const submit = useSubmit();
  const toast = useToast();
  const { data: users } = useApi(() => api('/users/directory'), []);

  useEffect(() => {
    if (!open) return;
    submit.reset();
    setErrors({});
    setV(trial ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, trial[k] ?? EMPTY[k]])) } : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trial]);

  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));
  const toggleTeam = (id) =>
    setV((s) => ({ ...s, team_ids: s.team_ids.includes(id) ? s.team_ids.filter((x) => x !== id) : [...s.team_ids, id] }));

  async function save() {
    const e = {};
    if (v.title.trim().length < 3) e.title = 'Enter a title (min 3 characters)';
    if (!v.phase) e.phase = 'Select a phase';
    if (!v.study_type) e.study_type = 'Select a study type';
    if (v.start_date && v.end_date && v.end_date < v.start_date) e.end_date = 'End date must be after the start date';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      ...v,
      title: v.title.trim(),
      target_enrollment: v.target_enrollment ? Number(v.target_enrollment) : null,
      pi_id: v.pi_id || null,
      start_date: v.start_date || null,
      end_date: v.end_date || null,
    };
    const res = await submit.run(() => (trial ? trialsApi.update(trial.id, body) : trialsApi.create(body)));
    if (!res.ok) return;
    toast(trial ? 'Trial updated' : `Trial ${res.data.trial_code} created`);
    onSaved(res.data);
    onClose();
  }

  const err = { ...submit.fieldErrors, ...errors };
  const pis = (users || []).filter((u) => u.role === 'principal_investigator');
  const team = (users || []).filter((u) => u.role !== 'admin');

  return (
    <FormModal open={open} onClose={onClose} size="lg" title={trial ? `Edit ${trial.trial_code}` : 'New clinical trial'}
      subtitle={trial ? undefined : 'A unique trial ID is assigned automatically. New trials start as Draft.'}
      onSubmit={save} loading={submit.loading} error={submit.error} submitLabel={trial ? 'Save changes' : 'Create trial'}>
      <Input label="Trial title" name="title" required value={v.title} onChange={on} error={err.title} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select label="Phase" name="phase" required placeholder="Select…" options={PHASES} value={v.phase} onChange={on} error={err.phase} />
        <Select label="Study type" name="study_type" required placeholder="Select…" options={STUDY_TYPES} value={v.study_type} onChange={on} error={err.study_type} />
        <Input label="Target enrollment" name="target_enrollment" type="number" min="1" value={v.target_enrollment} onChange={on} error={err.target_enrollment} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Therapeutic area" name="therapeutic_area" value={v.therapeutic_area} onChange={on} />
        <Input label="Sponsor" name="sponsor" value={v.sponsor} onChange={on} />
        <Input label="Start date" name="start_date" type="date" value={v.start_date} onChange={on} error={err.start_date} />
        <Input label="End date" name="end_date" type="date" value={v.end_date} onChange={on} error={err.end_date} />
      </div>
      <TextArea label="Description" name="description" value={v.description} onChange={on} />
      <TextArea label="Study objectives & research details" name="objectives" value={v.objectives} onChange={on} />
      <Select label="Principal investigator" name="pi_id" placeholder="Not assigned" value={v.pi_id} onChange={on} error={err.pi_id}
        options={pis.map((u) => ({ value: u.id, label: u.name }))} hint={!pis.length ? 'No Principal Investigator accounts exist yet.' : undefined} />
      <Field label="Research team">
        <div className="flex flex-wrap gap-2">
          {team.filter((u) => u.id !== v.pi_id).map((u) => {
            const on_ = v.team_ids.includes(u.id);
            return (
              <button type="button" key={u.id} onClick={() => toggleTeam(u.id)}
                className={`px-2.5 py-1 rounded-full border font-label-lg text-label-lg flex items-center gap-1 ${on_ ? 'bg-primary-fixed border-primary-container text-primary' : 'border-[#CBD5E1] text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined text-[16px]">{on_ ? 'check' : 'add'}</span>
                {u.name} <span className="opacity-70">• {u.role_label}</span>
              </button>
            );
          })}
          {!team.length && <span className="font-body-sm text-body-sm text-outline">No users available.</span>}
        </div>
      </Field>
    </FormModal>
  );
}
