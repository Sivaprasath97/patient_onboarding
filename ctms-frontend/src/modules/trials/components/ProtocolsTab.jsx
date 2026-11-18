import { useEffect, useState } from 'react';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, DetailList, EmptyState, ErrorState, Field, FormModal, Input, Spinner, StatusBadge, TextArea, useToast } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime } from '../../../shared/utils/format.js';
import { trialsApi } from '../services/trialsApi.js';

export default function ProtocolsTab({ trial, onChanged }) {
  const can = usePermission();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => trialsApi.protocols(trial.id), [trial.id]);
  const [editing, setEditing] = useState(null); // protocol | 'new' | null
  const [selected, setSelected] = useState(null);
  const activate = useSubmit();

  const protocols = data || [];
  const current = protocols.find((p) => p.id === selected) || protocols.find((p) => p.status === 'Active') || protocols[0];
  const hasDraft = protocols.some((p) => p.status === 'Draft');
  const locked = ['Completed', 'Terminated'].includes(trial.status);

  async function doActivate(p) {
    if (!window.confirm(`Activate protocol v${p.version}? Any currently active version will be superseded.`)) return;
    const res = await activate.run(() => trialsApi.activateProtocol(trial.id, p.id));
    if (!res.ok) return toast(res.error.message, 'error');
    toast(`Protocol v${p.version} is now active`);
    reload();
    onChanged();
  }

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <Card title="Versions" className="lg:col-span-3" bodyClassName="p-2"
        actions={can('protocols:write') && !hasDraft && !locked && (
          <Button size="sm" icon="add" onClick={() => setEditing('new')}>{protocols.length ? 'Amend' : 'New'}</Button>
        )}>
        {!protocols.length ? (
          <EmptyState icon="description" title="No protocol yet" message="Create the study protocol: criteria and visit schedule." />
        ) : (
          <ul className="space-y-1">
            {protocols.map((p) => (
              <li key={p.id}>
                <button onClick={() => setSelected(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 ${current?.id === p.id ? 'bg-surface-container' : 'hover:bg-surface-container-low'}`}>
                  <span className="font-label-lg text-label-lg">Version {p.version}</span>
                  <StatusBadge status={p.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {current && (
        <Card className="lg:col-span-9" title={`v${current.version} — ${current.title}`}
          subtitle={current.status === 'Active' ? `Activated ${formatDateTime(current.activated_at)} by ${current.activated_by?.name}` : `Created ${formatDateTime(current.created_at)}`}
          actions={current.status === 'Draft' && can('protocols:write') && (
            <>
              <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditing(current)}>Edit</Button>
              <Button size="sm" variant="success" icon="verified" loading={activate.loading} onClick={() => doActivate(current)}>Activate</Button>
            </>
          )}>
          <div className="space-y-5">
            <DetailList items={[
              ['Effective date', formatDate(current.effective_date)],
              ['Status', <StatusBadge key="s" status={current.status} />],
              ['Summary', current.summary, true],
              ['Objectives', current.objectives, true],
              ['Procedures', current.procedures, true],
              current.amendment_notes && ['Amendment notes', current.amendment_notes, true],
            ]} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Criteria title="Inclusion criteria" items={current.inclusion_criteria} icon="check_circle" color="text-[#23803A]" />
              <Criteria title="Exclusion criteria" items={current.exclusion_criteria} icon="cancel" color="text-[#DC2626]" />
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm mb-2">Visit schedule</h3>
              {!current.visit_schedule?.length ? (
                <p className="font-body-md text-body-md text-on-surface-variant">No visits defined.</p>
              ) : (
                <table className="w-full text-left">
                  <thead><tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {['#', 'Visit', 'Type', 'Day', 'Window'].map((h) => <th key={h} className="px-3 py-1.5 font-label-md text-[11px] uppercase text-[#64748B]">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {current.visit_schedule.map((s, i) => (
                      <tr key={i} className="border-b border-[#F1F5F9] font-body-md text-body-md">
                        <td className="px-3 py-1.5 font-data-mono">{i + 1}</td>
                        <td className="px-3 py-1.5">{s.name}</td>
                        <td className="px-3 py-1.5">{s.visit_type}</td>
                        <td className="px-3 py-1.5 font-data-mono">Day {s.day}</td>
                        <td className="px-3 py-1.5 font-data-mono">−{s.window_before} / +{s.window_after} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>
      )}

      <ProtocolFormModal open={!!editing} onClose={() => setEditing(null)} trial={trial} protocol={editing === 'new' ? null : editing}
        base={editing === 'new' ? protocols.find((p) => p.status === 'Active') : null}
        onSaved={(p) => { reload(); setSelected(p.id); }} />
    </div>
  );
}

function Criteria({ title, items, icon, color }) {
  return (
    <div className="border border-[#E2E8F0] rounded-lg p-3">
      <h3 className="font-headline-sm text-headline-sm mb-2">{title}</h3>
      {!items?.length ? <p className="font-body-md text-body-md text-on-surface-variant">None</p> : (
        <ul className="space-y-1.5">
          {items.map((c, i) => (
            <li key={i} className="flex items-start gap-2 font-body-md text-body-md">
              <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>{c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SPAN = { 1: 'col-span-1', 2: 'col-span-2', 4: 'col-span-4' };
const BLANK = { title: '', summary: '', objectives: '', procedures: '', amendment_notes: '', effective_date: '', inclusion_criteria: [''], exclusion_criteria: [''], visit_schedule: [] };

function ProtocolFormModal({ open, onClose, trial, protocol, base, onSaved }) {
  const [v, setV] = useState(BLANK);
  const submit = useSubmit();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    submit.reset();
    const src = protocol || base;
    setV(src ? {
      ...BLANK, ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, src[k] ?? BLANK[k]])),
      amendment_notes: protocol ? protocol.amendment_notes || '' : '',
      inclusion_criteria: src.inclusion_criteria?.length ? src.inclusion_criteria : [''],
      exclusion_criteria: src.exclusion_criteria?.length ? src.exclusion_criteria : [''],
    } : BLANK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));
  const setList = (key, i, val) => setV((s) => ({ ...s, [key]: s[key].map((x, j) => (j === i ? val : x)) }));
  const addTo = (key, item) => setV((s) => ({ ...s, [key]: [...s[key], item] }));
  const removeFrom = (key, i) => setV((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }));

  async function save() {
    if (v.title.trim().length < 3) return submit.setError('Enter a protocol title.');
    const body = {
      ...v,
      effective_date: v.effective_date || null,
      inclusion_criteria: v.inclusion_criteria.map((c) => c.trim()).filter(Boolean),
      exclusion_criteria: v.exclusion_criteria.map((c) => c.trim()).filter(Boolean),
      visit_schedule: v.visit_schedule.filter((s) => s.name.trim()).map((s) => ({
        ...s, day: Number(s.day) || 0, window_before: Number(s.window_before) || 0, window_after: Number(s.window_after) || 0,
      })),
    };
    const res = await submit.run(() => (protocol ? trialsApi.updateProtocol(trial.id, protocol.id, body) : trialsApi.createProtocol(trial.id, body)));
    if (!res.ok) return;
    toast(protocol ? 'Protocol saved' : `Protocol v${res.data.version} created as draft`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} size="xl" onSubmit={save} loading={submit.loading} error={submit.error}
      title={protocol ? `Edit protocol v${protocol.version}` : base ? 'New protocol version (amendment)' : 'New study protocol'}
      subtitle="Saved as a draft. Activate it to use it for screening and visit scheduling.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input className="md:col-span-2" label="Protocol title" name="title" required value={v.title} onChange={on} />
        <Input label="Effective date" name="effective_date" type="date" value={v.effective_date} onChange={on} />
      </div>
      <TextArea label="Summary" name="summary" value={v.summary} onChange={on} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextArea label="Objectives" name="objectives" value={v.objectives} onChange={on} />
        <TextArea label="Procedures" name="procedures" value={v.procedures} onChange={on} />
      </div>
      {base && <TextArea label="Amendment notes" name="amendment_notes" value={v.amendment_notes} onChange={on} hint="What changed compared with the previous version?" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['inclusion_criteria', 'Inclusion criteria'], ['exclusion_criteria', 'Exclusion criteria']].map(([key, label]) => (
          <Field key={key} label={label}>
            <div className="space-y-2">
              {v[key].map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input value={c} onChange={(e) => setList(key, i, e.target.value)} placeholder={`Criterion ${i + 1}`}
                    className="flex-1 h-9 px-3 border border-[#CBD5E1] rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary-container" />
                  <button type="button" onClick={() => removeFrom(key, i)} className="p-1 text-outline hover:text-error" aria-label="Remove">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
              <Button size="sm" variant="ghost" icon="add" onClick={() => addTo(key, '')}>Add criterion</Button>
            </div>
          </Field>
        ))}
      </div>

      <Field label="Visit schedule" hint="Day = days after the enrollment date. Visits are generated automatically when a participant is enrolled.">
        <div className="space-y-2">
          {v.visit_schedule.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              {[['name', 'Visit name', 4, 'text'], ['visit_type', 'Type', 2, 'text'], ['day', 'Day', 2, 'number'], ['window_before', '−Window', 2, 'number'], ['window_after', '+Window', 1, 'number']].map(([k, ph, span, type]) => (
                <input key={k} type={type} min="0" value={s[k]} placeholder={ph} title={ph}
                  onChange={(e) => setList('visit_schedule', i, { ...s, [k]: e.target.value })}
                  className={`${SPAN[span]} h-9 px-2 border border-[#CBD5E1] rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary-container`} />
              ))}
              <button type="button" onClick={() => removeFrom('visit_schedule', i)} className="col-span-1 p-1 text-outline hover:text-error" aria-label="Remove visit">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
          <Button size="sm" variant="ghost" icon="add"
            onClick={() => addTo('visit_schedule', { name: '', visit_type: 'Scheduled', day: v.visit_schedule.length ? '' : 0, window_before: 0, window_after: 0 })}>
            Add visit
          </Button>
        </div>
      </Field>
    </FormModal>
  );
}
