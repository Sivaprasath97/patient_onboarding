import { useEffect, useState } from 'react';
import { ParticipantPicker, TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { FormModal, Input, TextArea, useToast } from '../../../shared/ui/index.js';
import { todayISO } from '../../../shared/utils/format.js';
import { enrollmentApi } from '../services/enrollmentApi.js';

export default function StartScreeningModal({ open, onClose, defaults = {}, onSaved }) {
  const [v, setV] = useState({});
  const submit = useSubmit();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      submit.reset();
      setV({ participant_id: defaults.participant || '', trial_id: defaults.trial || '', screening_date: todayISO(), screening_notes: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));

  async function save() {
    if (!v.participant_id || !v.trial_id) return submit.setError('Select a participant and an active trial.');
    const res = await submit.run(() => enrollmentApi.startScreening({ ...v, screening_notes: v.screening_notes || null }));
    if (!res.ok) return;
    toast(`Screening started for ${res.data.participant_code}`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title="Start participant screening" onSubmit={save} loading={submit.loading} error={submit.error}
      subtitle="Only Active trials with an active protocol accept screening (BR-3). The protocol's eligibility criteria are copied into the checklist."
      submitLabel="Start screening">
      <ParticipantPicker name="participant_id" required value={v.participant_id} onChange={on}
        hint="Not listed? Register the participant first under Participants." />
      <TrialPicker name="trial_id" status="Active" label="Active trial" required value={v.trial_id} onChange={on} />
      <Input label="Screening date" name="screening_date" type="date" max={todayISO()} value={v.screening_date} onChange={on} />
      <TextArea label="Screening notes" name="screening_notes" value={v.screening_notes} onChange={on} />
    </FormModal>
  );
}
