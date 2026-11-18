import { useEffect, useState } from 'react';
import { RecordPicker, UserPicker } from '../../../shared/components/Pickers.jsx';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { FormModal, Input, Select, TextArea, useToast } from '../../../shared/ui/index.js';
import { ENTITY_TYPES, queriesApi } from '../services/queriesApi.js';

/** Raise a data query. `preset` = { entity_type, entity_id, label } when raised from a record page. */
export default function RaiseQueryModal({ open, onClose, preset, onSaved }) {
  const [v, setV] = useState({});
  const submit = useSubmit();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      submit.reset();
      setV({ entity_type: preset?.entity_type || 'assessment', entity_id: preset?.entity_id || '', field: '', question: '', priority: 'Medium', assigned_to: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value, ...(e.target.name === 'entity_type' ? { entity_id: '' } : {}) }));
  const type = ENTITY_TYPES.find((t) => t.value === v.entity_type);

  async function save() {
    if (!v.entity_id) return submit.setError('Select the record this query is about.');
    if (v.question.trim().length < 3) return submit.setError('Enter the query question.');
    const res = await submit.run(() => queriesApi.raise({ ...v, question: v.question.trim(), field: v.field || null, assigned_to: v.assigned_to || null }));
    if (!res.ok) return;
    toast(`Query ${res.data.query_code} raised`);
    onSaved?.(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title="Raise data query" subtitle={preset ? `On ${preset.label}` : 'Ask the site to clarify or correct a data point.'}
      onSubmit={save} loading={submit.loading} error={submit.error} submitLabel="Raise query">
      {!preset && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Record type" name="entity_type" options={ENTITY_TYPES} value={v.entity_type} onChange={on} />
          {type && (
            <RecordPicker key={type.value} className="md:col-span-2" path={type.path} label="Record" required name="entity_id"
              value={v.entity_id} onChange={on} labelOf={type.labelOf} />
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Field / data point" name="field" placeholder="e.g. Heart rate" value={v.field} onChange={on} />
        <Select label="Priority" name="priority" options={['Low', 'Medium', 'High']} value={v.priority} onChange={on} />
      </div>
      <TextArea label="Question" name="question" required rows={4} value={v.question} onChange={on} />
      <UserPicker label="Assign to" name="assigned_to" placeholder="Unassigned" value={v.assigned_to} onChange={on}
        hint="Usually the Research Coordinator or PI responsible for the data." />
    </FormModal>
  );
}
