import { useEffect, useState } from 'react';
import { EnrollmentPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { Checkbox, Field, FormModal, Input, Select, TextArea, useToast } from '../../../shared/ui/index.js';
import { todayISO } from '../../../shared/utils/format.js';
import { aeApi } from '../services/aeApi.js';

const EMPTY = { enrollment_id: '', term: '', description: '', onset_date: todayISO(), resolution_date: '', severity: '', serious: false, seriousness_criteria: [], causality: 'Not assessed', action_taken: '', outcome: 'Ongoing' };

export default function AEFormModal({ open, onClose, ae, onSaved }) {
  const [v, setV] = useState(EMPTY);
  const submit = useSubmit();
  const toast = useToast();
  const { data: meta } = useApi(() => aeApi.meta(), []);

  useEffect(() => {
    if (!open) return;
    submit.reset();
    setV(ae ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, ae[k] ?? EMPTY[k]])) } : { ...EMPTY, onset_date: todayISO() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const on = (e) => {
    const { name, value, type, checked } = e.target;
    setV((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value, ...(name === 'serious' && !checked ? { seriousness_criteria: [] } : {}) }));
  };
  const toggleCrit = (c) => setV((s) => ({ ...s, seriousness_criteria: s.seriousness_criteria.includes(c) ? s.seriousness_criteria.filter((x) => x !== c) : [...s.seriousness_criteria, c] }));

  async function save() {
    if (!ae && !v.enrollment_id) return submit.setError('Select the participant enrollment.');
    if (v.term.trim().length < 2 || v.description.trim().length < 3 || !v.severity) return submit.setError('Event term, description and severity are required.');
    if (v.serious && !v.seriousness_criteria.length) return submit.setError('Select at least one seriousness criterion for a serious adverse event.');
    const body = { ...v, resolution_date: v.resolution_date || null, action_taken: v.action_taken || null };
    if (ae) { delete body.enrollment_id; delete body.causality; }
    const res = await submit.run(() => (ae ? aeApi.update(ae.id, body) : aeApi.create(body)));
    if (!res.ok) return;
    toast(ae ? 'Adverse event updated' : `${res.data.ae_code} reported${v.serious ? ' — PIs notified' : ''}`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} size="lg" onSubmit={save} loading={submit.loading} error={submit.error}
      title={ae ? `Edit ${ae.ae_code}` : 'Report adverse event'} submitLabel={ae ? 'Save changes' : 'Report event'} submitVariant={v.serious ? 'solidDanger' : 'primary'}
      subtitle={ae ? undefined : 'The trial team is notified. Serious events alert all Principal Investigators.'}>
      {!ae && <EnrollmentPicker name="enrollment_id" required value={v.enrollment_id} onChange={on} />}
      <Input label="Adverse event term" name="term" required placeholder="e.g. Neutropenia" value={v.term} onChange={on} />
      <TextArea label="Description" name="description" required value={v.description} onChange={on} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Onset date" name="onset_date" type="date" max={todayISO()} required value={v.onset_date} onChange={on} />
        <Input label="Resolution date" name="resolution_date" type="date" min={v.onset_date} value={v.resolution_date} onChange={on} />
        <Select label="Severity" name="severity" required placeholder="Select…" options={meta?.severity || []} value={v.severity} onChange={on} />
        {!ae && <Select label="Initial causality" name="causality" options={meta?.causality || []} value={v.causality} onChange={on} hint="Final causality is assessed by the PI." />}
        <Select label="Outcome" name="outcome" options={meta?.outcome || []} value={v.outcome} onChange={on} />
      </div>
      <div className={`p-3 rounded-lg border ${v.serious ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}>
        <Checkbox name="serious" checked={v.serious} onChange={on} label="Serious adverse event (SAE)" hint="Expedited reporting applies to serious events." />
        {v.serious && (
          <Field label="Seriousness criteria" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {(meta?.seriousness_criteria || []).map((c) => (
                <button type="button" key={c} onClick={() => toggleCrit(c)}
                  className={`px-2.5 py-1 rounded-full border font-label-lg text-label-lg ${v.seriousness_criteria.includes(c) ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'border-[#FCA5A5] text-[#B91C1C] bg-white'}`}>{c}</button>
              ))}
            </div>
          </Field>
        )}
      </div>
      <TextArea label="Action taken" name="action_taken" rows={2} value={v.action_taken} onChange={on} />
    </FormModal>
  );
}
