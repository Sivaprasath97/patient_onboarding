import { useState } from 'react';
import { ParticipantPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useForm, useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DataTable, FormModal, Input, Select, StatusBadge, TextArea, useToast } from '../../../shared/ui/index.js';
import { formatDate, todayISO } from '../../../shared/utils/format.js';
import { trialsApi } from '../services/trialsApi.js';

export default function DeviationsTab({ trial }) {
  const can = usePermission();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => trialsApi.deviations(trial.id), [trial.id]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState('');
  const form = useForm({ participant_id: '', category: '', description: '', severity: 'Minor', occurred_on: todayISO(), corrective_action: '' });
  const submit = useSubmit();

  async function create() {
    const v = form.values;
    if (!v.category.trim() || v.description.trim().length < 3) return submit.setError('Category and description are required.');
    const res = await submit.run(() => trialsApi.createDeviation(trial.id, { ...v, participant_id: v.participant_id || null, corrective_action: v.corrective_action || null }));
    if (!res.ok) return;
    toast(`Deviation ${res.data.deviation_code} recorded`);
    setOpen(false);
    form.reset();
    reload();
  }

  async function resolve() {
    if (resolution.trim().length < 3) return submit.setError('Describe the resolution.');
    const res = await submit.run(() => trialsApi.resolveDeviation(trial.id, resolving.id, resolution.trim()));
    if (!res.ok) return;
    toast('Deviation resolved');
    setResolving(null);
    reload();
  }

  const columns = [
    { key: 'deviation_code', label: 'ID', render: (d) => <Code>{d.deviation_code}</Code> },
    { key: 'occurred_on', label: 'Occurred', render: (d) => formatDate(d.occurred_on) },
    { key: 'participant_code', label: 'Participant', render: (d) => d.participant_code || '—' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description', className: 'max-w-md', render: (d) => <span className="line-clamp-2">{d.description}</span> },
    { key: 'severity', label: 'Severity', render: (d) => <StatusBadge status={d.severity} /> },
    { key: 'status', label: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'reported_by', label: 'Reported by', render: (d) => d.reported_by?.name },
    { key: 'actions', label: '', render: (d) => d.status === 'Open' && can('deviations:write') && (
      <Button size="sm" variant="secondary" onClick={() => { setResolving(d); setResolution(''); submit.reset(); }}>Resolve</Button>
    ) },
  ];

  return (
    <Card title="Protocol deviations" bodyClassName="p-0"
      actions={can('deviations:write') && <Button size="sm" variant="danger" icon="report" onClick={() => { submit.reset(); setOpen(true); }}>Report deviation</Button>}>
      <DataTable columns={columns} rows={data || []} loading={loading} error={error} onRetry={reload} />

      <FormModal open={open} onClose={() => setOpen(false)} title="Report protocol deviation" onSubmit={create} loading={submit.loading} error={submit.error} submitLabel="Report">
        <ParticipantPicker name="participant_id" status="" label="Participant (optional)" placeholder="Not participant-specific" value={form.values.participant_id} onChange={form.onChange} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Category" name="category" required placeholder="e.g. Visit window" value={form.values.category} onChange={form.onChange} className="md:col-span-1" />
          <Select label="Severity" name="severity" options={['Minor', 'Major', 'Critical']} value={form.values.severity} onChange={form.onChange} />
          <Input label="Occurred on" name="occurred_on" type="date" value={form.values.occurred_on} onChange={form.onChange} />
        </div>
        <TextArea label="Description" name="description" required value={form.values.description} onChange={form.onChange} />
        <TextArea label="Corrective / preventive action" name="corrective_action" value={form.values.corrective_action} onChange={form.onChange} />
      </FormModal>

      <FormModal open={!!resolving} onClose={() => setResolving(null)} title={`Resolve ${resolving?.deviation_code}`} size="sm" onSubmit={resolve}
        loading={submit.loading} error={submit.error} submitLabel="Mark resolved">
        <TextArea label="Resolution" name="resolution" required value={resolution} onChange={(e) => setResolution(e.target.value)} />
      </FormModal>
    </Card>
  );
}
