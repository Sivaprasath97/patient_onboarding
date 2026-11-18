import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../../shared/api/client.js';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, ErrorState, FormAlert, FormModal, Page, PageHeader, Spinner, StatusBadge, TextArea, Timeline, useToast } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime, humanize } from '../../../shared/utils/format.js';
import RaiseQueryModal from '../../data-queries/components/RaiseQueryModal.jsx';
import { assessmentsApi } from '../services/assessmentsApi.js';

const VITALS = [
  ['systolic_bp', 'Systolic BP', 'mmHg', true], ['diastolic_bp', 'Diastolic BP', 'mmHg', true],
  ['heart_rate', 'Heart rate', 'bpm', true], ['temperature_c', 'Temperature', '°C', true],
  ['respiratory_rate', 'Respiratory rate', '/min'], ['spo2', 'SpO₂', '%'],
  ['weight_kg', 'Weight', 'kg'], ['height_cm', 'Height', 'cm'],
];
const EMPTY = { vitals: {}, examination: '', lab_results: [], observations: '' };

export default function AssessmentFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const visitId = params.get('visit');
  const isNew = !id;
  const navigate = useNavigate();
  const can = usePermission();
  const toast = useToast();

  const { data: a, loading, error, reload, setData } = useApi(() => (isNew ? null : assessmentsApi.get(id)), [id]);
  const { data: visit } = useApi(() => (isNew && visitId ? api(`/visits/${visitId}`) : null), [visitId]);
  const [v, setV] = useState(EMPTY);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const save = useSubmit();
  const fin = useSubmit();

  useEffect(() => {
    if (a) setV({ vitals: a.vitals || {}, examination: a.examination || '', lab_results: a.lab_results || [], observations: a.observations || '' });
  }, [a]);

  if (error) return <Page><ErrorState error={error} onRetry={reload} /></Page>;
  if (!isNew && loading && !a) return <Page><Spinner /></Page>;
  if (isNew && !visitId) return <Page><ErrorState error={{ message: 'No visit selected. Start from Medical assessments → New assessment.' }} /></Page>;

  const ctx = a || visit;
  const finalized = a?.status === 'Finalized';
  const editable = can('assessments:write');

  const setVital = (k, val) => setV((s) => ({ ...s, vitals: { ...s.vitals, [k]: val === '' ? null : Number(val) } }));
  const setLab = (i, k, val) => setV((s) => ({ ...s, lab_results: s.lab_results.map((l, j) => (j === i ? { ...l, [k]: val } : l)) }));

  function body() {
    return {
      vitals: v.vitals,
      examination: v.examination || null,
      observations: v.observations || null,
      lab_results: v.lab_results.filter((l) => l.test?.trim() && String(l.value ?? '').trim())
        .map((l) => ({ test: l.test.trim(), value: String(l.value).trim(), unit: l.unit || null, reference_range: l.reference_range || null })),
    };
  }

  async function onSave(reason) {
    const res = await save.run(() => (isNew ? assessmentsApi.create({ ...body(), visit_id: visitId }) : assessmentsApi.update(a.id, { ...body(), correction_reason: reason || null })));
    if (!res.ok) return false;
    toast(isNew ? 'Assessment saved as draft' : finalized ? 'Correction recorded' : 'Assessment saved');
    if (isNew) navigate(`/assessments/${res.data.id}`, { replace: true });
    else setData(res.data);
    return true;
  }

  async function onFinalize() {
    if (!window.confirm('Finalize this assessment? After finalizing, any change requires a documented correction reason.')) return;
    const res = await fin.run(() => assessmentsApi.finalize(a.id));
    if (!res.ok) return toast(res.error.message, 'error');
    toast('Assessment finalized');
    setData(res.data);
  }

  return (
    <Page>
      <PageHeader back={{ to: '/assessments', label: 'Medical assessments' }}
        title={isNew ? 'New medical assessment' : `Assessment — ${a.visit_name}`}
        badge={a && <StatusBadge status={a.status} />}
        subtitle={ctx && <>
          <Link to={`/participants/${ctx.participant_id}`} className="hover:underline"><Code>{ctx.participant_code}</Code></Link> {ctx.participant_name} • <Code>{ctx.trial_code}</Code> • {ctx.visit_name} ({formatDate(ctx.visit_date || ctx.completed_date || ctx.scheduled_date)})
        </>}
        actions={!isNew && (
          <>
            {can('queries:raise') && <Button variant="secondary" icon="help" onClick={() => setQueryOpen(true)}>Raise query</Button>}
            {editable && (finalized
              ? <Button icon="edit_note" onClick={() => { save.reset(); setCorrectOpen(true); }}>Save correction</Button>
              : <Button variant="secondary" icon="save" loading={save.loading} onClick={() => onSave()}>Save draft</Button>)}
            {!finalized && can('assessments:finalize') && <Button variant="success" icon="verified" loading={fin.loading} onClick={onFinalize}>Finalize</Button>}
          </>
        )} />

      {finalized && (
        <div className="p-3 rounded-lg border-l-4 border-primary-container bg-primary-fixed font-body-md text-body-md text-primary">
          Finalized by {a.finalized_by?.name} on {formatDateTime(a.finalized_at)}. Changes are kept as documented corrections (BR-8).
        </div>
      )}
      {a?.status === 'Draft' && a.missing_fields?.length > 0 && (
        <div className="p-3 rounded-lg border-l-4 border-[#D97706] bg-[#FEF3C7] font-body-md text-body-md text-[#B45309]">
          Required before finalizing: {a.missing_fields.join(', ')}
        </div>
      )}
      <FormAlert>{!correctOpen && save.error}</FormAlert>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <Card title="Vital signs" icon="monitor_heart">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VITALS.map(([k, label, unit, req]) => (
                <label key={k} className="block space-y-1">
                  <span className="font-label-lg text-label-lg">{label}{req && <span className="text-error">*</span>}</span>
                  <div className="relative">
                    <input type="number" step="any" disabled={!editable} value={v.vitals[k] ?? ''} onChange={(e) => setVital(k, e.target.value)}
                      className="w-full h-9 pl-3 pr-12 border border-[#CBD5E1] rounded-lg font-data-mono text-data-mono focus:outline-none focus:border-primary-container disabled:bg-[#F8FAFC]" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-body-sm text-body-sm text-outline">{unit}</span>
                  </div>
                  {save.fieldErrors[k] && <span className="font-body-sm text-body-sm text-error">{save.fieldErrors[k]}</span>}
                </label>
              ))}
            </div>
          </Card>

          <Card title="Laboratory results" icon="science" bodyClassName="p-0"
            actions={editable && <Button size="sm" variant="ghost" icon="add" onClick={() => setV((s) => ({ ...s, lab_results: [...s.lab_results, { test: '', value: '', unit: '', reference_range: '' }] }))}>Add result</Button>}>
            {!v.lab_results.length ? <p className="p-4 font-body-md text-body-md text-on-surface-variant">No lab results recorded.</p> : (
              <table className="w-full text-left">
                <thead><tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {['Test', 'Value', 'Unit', 'Reference range', 'Flag', ''].map((h) => <th key={h} className="px-3 py-2 font-label-md text-[11px] uppercase text-[#64748B]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {v.lab_results.map((l, i) => (
                    <tr key={i} className="border-b border-[#F1F5F9]">
                      {['test', 'value', 'unit', 'reference_range'].map((k) => (
                        <td key={k} className="px-2 py-1.5">
                          <input value={l[k] ?? ''} disabled={!editable} onChange={(e) => setLab(i, k, e.target.value)} placeholder={k === 'reference_range' ? 'e.g. 3.5-5.0' : ''}
                            className={`w-full h-8 px-2 border border-[#CBD5E1] rounded-md focus:outline-none focus:border-primary-container disabled:bg-[#F8FAFC] ${k === 'test' ? 'font-body-md text-body-md' : 'font-data-mono text-data-mono'}`} />
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        {l.flag && <span className={`font-data-mono text-data-mono font-semibold ${l.flag === 'N' ? 'text-[#23803A]' : 'text-[#DC2626]'}`}>{l.flag === 'N' ? 'Normal' : l.flag === 'H' ? '▲ High' : '▼ Low'}</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        {editable && <button onClick={() => setV((s) => ({ ...s, lab_results: s.lab_results.filter((_, j) => j !== i) }))} className="p-1 text-outline hover:text-error" aria-label="Remove">
                          <span className="material-symbols-outlined text-[18px]">delete</span></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Examination & observations" icon="clinical_notes">
            <div className="space-y-4">
              <TextArea label="Medical examination details" name="examination" rows={4} disabled={!editable} value={v.examination} onChange={(e) => setV((s) => ({ ...s, examination: e.target.value }))} />
              <TextArea label="Investigator observations" name="observations" required rows={4} disabled={!editable} value={v.observations} onChange={(e) => setV((s) => ({ ...s, observations: e.target.value }))} />
            </div>
          </Card>
          {isNew && <div className="flex justify-end"><Button icon="save" loading={save.loading} onClick={() => onSave()}>Save draft</Button></div>}
        </div>

        <div className="xl:col-span-4 space-y-5">
          {a && (
            <Card title="Record" icon="info">
              <ul className="space-y-1.5 font-body-md text-body-md">
                <li>Recorded by <b>{a.recorded_by?.name}</b> • {formatDateTime(a.created_at)}</li>
                <li>Last updated {formatDateTime(a.updated_at)}</li>
                {a.finalized_by && <li>Finalized by <b>{a.finalized_by.name}</b></li>}
              </ul>
            </Card>
          )}
          {a && (
            <Card title="Correction history" icon="history">
              <Timeline items={[...(a.corrections || [])].reverse().map((c) => ({
                title: c.reason,
                body: Object.keys(c.changes || {}).map(humanize).join(', '),
                meta: `${formatDateTime(c.at)} • ${c.by?.name}`,
              }))} />
            </Card>
          )}
        </div>
      </div>

      <FormModal open={correctOpen} onClose={() => setCorrectOpen(false)} title="Correct finalized assessment" size="sm"
        subtitle="Finalized records can't be silently overwritten. Document why this change is needed." submitLabel="Save correction"
        loading={save.loading} error={save.error}
        onSubmit={async () => {
          const reason = document.getElementById('f-correction_reason').value.trim();
          if (reason.length < 3) return save.setError('Enter a correction reason.');
          if (await onSave(reason)) setCorrectOpen(false);
        }}>
        <TextArea label="Correction reason" name="correction_reason" required rows={3} />
      </FormModal>
      {a && <RaiseQueryModal open={queryOpen} onClose={() => setQueryOpen(false)} preset={{ entity_type: 'assessment', entity_id: a.id, label: `${a.participant_code} / ${a.visit_name}` }} />}
    </Page>
  );
}
