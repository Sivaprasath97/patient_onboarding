import { useEffect, useState } from 'react';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { FormModal, Input, Select, TextArea, useToast } from '../../../shared/ui/index.js';
import { todayISO } from '../../../shared/utils/format.js';
import { participantsApi, SEXES } from '../services/participantsApi.js';

const EMPTY = {
  first_name: '', last_name: '', date_of_birth: '', sex: '', phone: '', email: '', address: '',
  ec_name: '', ec_relationship: '', ec_phone: '', medical_history: '', allergies: '', current_medications: '',
};

export default function ParticipantFormModal({ open, onClose, participant, onSaved }) {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const submit = useSubmit();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    submit.reset();
    setErrors({});
    if (participant) {
      const ec = participant.emergency_contact || {};
      setV({
        ...EMPTY,
        ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, participant[k] ?? ''])),
        ec_name: ec.name || '', ec_relationship: ec.relationship || '', ec_phone: ec.phone || '',
      });
    } else setV(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, participant]);

  const on = (e) => {
    setV((s) => ({ ...s, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  async function save() {
    const e = {};
    if (!v.first_name.trim()) e.first_name = 'Required';
    if (!v.last_name.trim()) e.last_name = 'Required';
    if (!v.date_of_birth) e.date_of_birth = 'Required';
    else if (v.date_of_birth >= todayISO()) e.date_of_birth = 'Must be in the past';
    if (!v.sex) e.sex = 'Required';
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Invalid email';
    setErrors(e);
    if (Object.keys(e).length) return;

    const body = {
      first_name: v.first_name.trim(), last_name: v.last_name.trim(), date_of_birth: v.date_of_birth, sex: v.sex,
      phone: v.phone || null, email: v.email || null, address: v.address || null,
      emergency_contact: { name: v.ec_name || null, relationship: v.ec_relationship || null, phone: v.ec_phone || null },
      medical_history: v.medical_history || null, allergies: v.allergies || null, current_medications: v.current_medications || null,
    };
    const res = await submit.run(() => (participant ? participantsApi.update(participant.id, body) : participantsApi.create(body)));
    if (!res.ok) return;
    toast(participant ? 'Participant updated' : `Participant ${res.data.participant_code} registered`);
    onSaved(res.data);
    onClose();
  }

  const err = { ...submit.fieldErrors, ...errors };
  return (
    <FormModal open={open} onClose={onClose} size="lg" onSubmit={save} loading={submit.loading} error={submit.error}
      title={participant ? `Edit ${participant.participant_code}` : 'Register participant'}
      subtitle={participant ? undefined : 'A unique participant ID is generated automatically.'}
      submitLabel={participant ? 'Save changes' : 'Register'}>
      <Section title="Demographics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First name" name="first_name" required value={v.first_name} onChange={on} error={err.first_name} />
          <Input label="Last name" name="last_name" required value={v.last_name} onChange={on} error={err.last_name} />
          <Input label="Date of birth" name="date_of_birth" type="date" required max={todayISO()} value={v.date_of_birth} onChange={on} error={err.date_of_birth} />
          <Select label="Sex" name="sex" required placeholder="Select…" options={SEXES} value={v.sex} onChange={on} error={err.sex} />
        </div>
      </Section>
      <Section title="Contact information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Phone" name="phone" type="tel" value={v.phone} onChange={on} error={err.phone} />
          <Input label="Email" name="email" type="email" value={v.email} onChange={on} error={err.email} />
          <TextArea className="md:col-span-2" label="Address" name="address" rows={2} value={v.address} onChange={on} />
        </div>
      </Section>
      <Section title="Emergency contact">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Name" name="ec_name" value={v.ec_name} onChange={on} />
          <Input label="Relationship" name="ec_relationship" value={v.ec_relationship} onChange={on} />
          <Input label="Phone" name="ec_phone" type="tel" value={v.ec_phone} onChange={on} />
        </div>
      </Section>
      <Section title="Medical history">
        <TextArea label="Relevant medical history" name="medical_history" rows={3} value={v.medical_history} onChange={on} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextArea label="Allergies" name="allergies" rows={2} value={v.allergies} onChange={on} />
          <TextArea label="Current medications" name="current_medications" rows={2} value={v.current_medications} onChange={on} />
        </div>
      </Section>
    </FormModal>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-label-md text-label-md text-primary-container uppercase tracking-[0.04em] mb-2">{title}</legend>
      {children}
    </fieldset>
  );
}
