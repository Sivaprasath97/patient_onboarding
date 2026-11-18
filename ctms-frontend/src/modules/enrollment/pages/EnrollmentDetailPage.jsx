import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReasonModal from '../../../shared/components/ReasonModal.jsx';
import { RecordPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DetailList, ErrorState, FormAlert, FormModal, Input, Page, PageHeader, Select, Spinner, StatusBadge, TextArea, useToast } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime, todayISO } from '../../../shared/utils/format.js';
import { CONSENT_STATUSES, enrollmentApi } from '../services/enrollmentApi.js';

export default function EnrollmentDetailPage() {
  const { id } = useParams();
  const can = usePermission();
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const { data: e, loading, error, reload, setData } = useApi(() => enrollmentApi.get(id), [id]);
  const completeSubmit = useSubmit();

  if (error) return <Page><ErrorState error={error} onRetry={reload} /></Page>;
  if (loading && !e) return <Page><Spinner /></Page>;

  const screening = e.status === 'Screening';
  const canWrite = can('enrollment:write');
  const consentSigned = e.consent?.status === 'Signed';
  const steps = [
    ['Screening', true],
    ['Eligibility verified', e.eligibility_result === 'Eligible'],
    ['Consent signed', consentSigned],
    ['Enrolled', ['Enrolled', 'Completed'].includes(e.status)],
  ];

  async function complete() {
    if (!window.confirm('Mark this participant as having completed the study?')) return;
    const res = await completeSubmit.run(() => enrollmentApi.complete(e.id));
    if (!res.ok) return toast(res.error.message, 'error');
    toast('Study completion recorded');
    setData(res.data);
  }

  return (
    <Page>
      <PageHeader back={{ to: '/enrollment', label: 'Enrollment' }} title={`${e.participant_name}`} badge={<StatusBadge status={e.status} />}
        subtitle={<>
          <Link to={`/participants/${e.participant_id}`} className="font-data-mono text-primary-container font-semibold hover:underline">{e.participant_code}</Link>
          {' → '}
          <Link to={`/trials/${e.trial_id}`} className="font-data-mono text-primary-container font-semibold hover:underline">{e.trial_code}</Link>
          {` ${e.trial_title} • protocol v${e.protocol_version}`}
        </>}
        actions={canWrite && (
          <>
            {screening && <Button variant="danger" icon="block" onClick={() => setModal('fail')}>Screen fail</Button>}
            {['Screening', 'Enrolled'].includes(e.status) && <Button variant="secondary" icon="person_off" onClick={() => setModal('withdraw')}>Withdraw</Button>}
            {e.status === 'Enrolled' && <Button variant="secondary" icon="verified" loading={completeSubmit.loading} onClick={complete}>Complete study</Button>}
          </>
        )} />

      {/* Progress stepper */}
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map(([label, done], i) => (
          <li key={label} className={`flex items-center gap-2 p-3 rounded-xl border ${done ? 'border-[#B7E2BF] bg-[#EEF8EF]' : 'border-[#E2E8F0] bg-surface-container-lowest'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-label-lg text-label-lg ${done ? 'bg-[#23803A] text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              {done ? <span className="material-symbols-outlined text-[18px]">check</span> : i + 1}
            </span>
            <span className="font-label-lg text-label-lg">{label}</span>
          </li>
        ))}
      </ol>

      {e.status === 'Screen Failed' && <Banner tone="red">Screen failed: {e.screen_fail_reason}</Banner>}
      {e.status === 'Withdrawn' && <Banner tone="red">Withdrawn on {formatDate(e.withdrawal_date)}: {e.withdrawal_reason}</Banner>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <EligibilityCard enrollment={e} editable={screening && canWrite} onSaved={setData} />
        </div>
        <div className="xl:col-span-5 space-y-5">
          <ConsentCard enrollment={e} editable={['Screening', 'Enrolled'].includes(e.status) && canWrite} onEdit={() => setModal('consent')} />
          {screening && canWrite && <EnrollCard enrollment={e} onEnroll={() => setModal('enroll')} />}
          <Card title="Screening details" icon="assignment">
            <DetailList cols={1} items={[
              ['Screening date', formatDate(e.screening_date)], ['Notes', e.screening_notes],
              ['Started by', `${e.created_by?.name} • ${formatDateTime(e.created_at)}`],
              e.enrollment_date && ['Enrollment date', `${formatDate(e.enrollment_date)}${e.arm ? ` • ${e.arm}` : ''}`],
            ]} />
          </Card>
        </div>
      </div>

      {!!e.visits?.length && (
        <Card title="Visit schedule" icon="calendar_month" bodyClassName="p-0"
          actions={<Link to={`/visits?enrollment=${e.id}`} className="font-label-lg text-label-lg text-primary-container hover:underline">Manage visits</Link>}>
          <table className="w-full text-left">
            <thead><tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {['#', 'Visit', 'Scheduled', 'Window', 'Status'].map((h) => <th key={h} className="px-4 py-2 font-label-md text-[11px] uppercase text-[#64748B]">{h}</th>)}
            </tr></thead>
            <tbody>
              {e.visits.map((v) => (
                <tr key={v.id} className="border-b border-[#F1F5F9] font-body-md text-body-md">
                  <td className="px-4 py-2 font-data-mono">{v.visit_number}</td>
                  <td className="px-4 py-2">{v.visit_name}</td>
                  <td className="px-4 py-2">{formatDate(v.scheduled_date)}</td>
                  <td className="px-4 py-2 font-data-mono-sm text-data-mono-sm">{formatDate(v.window_start)} – {formatDate(v.window_end)}</td>
                  <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ConsentModal open={modal === 'consent'} onClose={() => setModal(null)} enrollment={e} onSaved={setData} />
      <EnrollModal open={modal === 'enroll'} onClose={() => setModal(null)} enrollment={e} onSaved={setData} />
      <ReasonModal open={modal === 'fail'} onClose={() => setModal(null)} title="Record screen failure" label="Screen failure reason"
        submitLabel="Record screen failure" successMessage="Screen failure recorded"
        onConfirm={(r) => enrollmentApi.screenFail(e.id, r)} onDone={setData} />
      <ReasonModal open={modal === 'withdraw'} onClose={() => setModal(null)} title="Withdraw from trial" label="Withdrawal reason"
        subtitle="Scheduled visits will be cancelled. Records are retained." submitLabel="Withdraw" successMessage="Participant withdrawn from trial"
        onConfirm={(r) => enrollmentApi.withdraw(e.id, r)} onDone={setData} />
    </Page>
  );
}

function Banner({ tone, children }) {
  const cls = tone === 'red' ? 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]' : 'border-primary-container bg-primary-fixed text-primary';
  return <div className={`p-3 rounded-lg border-l-4 font-body-md text-body-md ${cls}`}>{children}</div>;
}

function EligibilityCard({ enrollment: e, editable, onSaved }) {
  const [answers, setAnswers] = useState(e.eligibility.map((c) => c.met));
  const [notes, setNotes] = useState(e.eligibility_notes || '');
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => setAnswers(e.eligibility.map((c) => c.met)), [e.eligibility]);

  async function save() {
    const res = await submit.run(() => enrollmentApi.eligibility(e.id, answers, notes || null));
    if (!res.ok) return;
    toast(`Eligibility saved: ${res.data.eligibility_result}`);
    onSaved(res.data);
  }

  const dirty = JSON.stringify(answers) !== JSON.stringify(e.eligibility.map((c) => c.met)) || notes !== (e.eligibility_notes || '');

  return (
    <Card title="Eligibility checklist" icon="checklist" subtitle="All inclusion criteria must be met and no exclusion criteria may apply (BR-5)."
      actions={<StatusBadge status={e.eligibility_result} />}>
      <div className="space-y-4">
        <FormAlert>{submit.error}</FormAlert>
        {['inclusion', 'exclusion'].map((type) => (
          <div key={type}>
            <h3 className="font-label-md text-label-md uppercase tracking-[0.04em] text-on-surface-variant mb-2">
              {type === 'inclusion' ? 'Inclusion criteria — must be YES' : 'Exclusion criteria — must be NO'}
            </h3>
            <ul className="space-y-2">
              {e.eligibility.map((c, i) => c.type === type && (
                <li key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="font-body-md text-body-md flex-1">{c.criterion}</span>
                  <div className="flex gap-1">
                    {[[true, 'Yes'], [false, 'No']].map(([val, label]) => {
                      const selected = answers[i] === val;
                      const good = type === 'inclusion' ? val : !val;
                      return (
                        <button key={label} type="button" disabled={!editable}
                          onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? val : x)))}
                          className={`px-3 h-7 rounded-md border font-label-lg text-label-lg disabled:cursor-default ${selected ? (good ? 'bg-[#23803A] border-[#23803A] text-white' : 'bg-[#DC2626] border-[#DC2626] text-white') : 'border-[#CBD5E1] text-on-surface-variant hover:bg-surface-container-low'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {editable ? (
          <>
            <TextArea label="Investigator notes" name="notes" rows={2} value={notes} onChange={(ev) => setNotes(ev.target.value)} />
            <div className="flex justify-end">
              <Button icon="save" onClick={save} loading={submit.loading} disabled={!dirty}>Save eligibility</Button>
            </div>
          </>
        ) : (
          e.eligibility_reviewed_by && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Reviewed by {e.eligibility_reviewed_by.name} • {formatDateTime(e.eligibility_reviewed_at)}{e.eligibility_notes ? ` — ${e.eligibility_notes}` : ''}
            </p>
          )
        )}
      </div>
    </Card>
  );
}

function ConsentCard({ enrollment: e, editable, onEdit }) {
  const c = e.consent || { status: 'Pending' };
  return (
    <Card title="Informed consent" icon="signature" actions={<StatusBadge status={c.status} />}>
      <DetailList cols={1} items={[
        ['Consent date', formatDate(c.consent_date)],
        ['Consent form version', c.consent_version],
        ['Document', c.document_id ? <Link key="d" to="/documents" className="text-primary-container hover:underline">Linked document</Link> : '—'],
        c.notes && ['Notes', c.notes],
        c.recorded_by && ['Recorded by', `${c.recorded_by.name} • ${formatDateTime(c.recorded_at)}`],
      ]} />
      {c.status !== 'Signed' && e.status === 'Screening' && (
        <p className="mt-3 font-body-sm text-body-sm text-[#B45309]">Consent must be signed before the participant can be enrolled (BR-4).</p>
      )}
      {editable && <div className="mt-3"><Button variant="secondary" icon="edit_document" onClick={onEdit}>Record consent</Button></div>}
    </Card>
  );
}

function EnrollCard({ enrollment: e, onEnroll }) {
  const ready = e.eligibility_result === 'Eligible' && e.consent?.status === 'Signed';
  return (
    <Card title="Enroll participant" icon="how_to_reg">
      <ul className="space-y-1.5 font-body-md text-body-md mb-3">
        <Check ok={e.eligibility_result === 'Eligible'}>Eligibility criteria satisfied</Check>
        <Check ok={e.consent?.status === 'Signed'}>Informed consent signed</Check>
      </ul>
      <Button className="w-full" variant="success" icon="how_to_reg" disabled={!ready} onClick={onEnroll}>Enroll participant</Button>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">The visit schedule is generated from protocol v{e.protocol_version}.</p>
    </Card>
  );
}

function Check({ ok, children }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`material-symbols-outlined text-[18px] ${ok ? 'text-[#23803A]' : 'text-outline'}`}>{ok ? 'check_circle' : 'radio_button_unchecked'}</span>
      {children}
    </li>
  );
}

function ConsentModal({ open, onClose, enrollment: e, onSaved }) {
  const [v, setV] = useState({});
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    submit.reset();
    const c = e.consent || {};
    setV({ status: c.status === 'Pending' ? 'Signed' : c.status || 'Signed', consent_date: c.consent_date || todayISO(), consent_version: c.consent_version || '', document_id: c.document_id || '', notes: c.notes || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const on = (ev) => setV((s) => ({ ...s, [ev.target.name]: ev.target.value }));

  async function save() {
    if (v.status === 'Signed' && (!v.consent_date || !v.consent_version.trim())) return submit.setError('Consent date and form version are required for signed consent.');
    const res = await submit.run(() => enrollmentApi.consent(e.id, {
      status: v.status, consent_date: v.consent_date || null, consent_version: v.consent_version || null,
      document_id: v.document_id || null, notes: v.notes || null,
    }));
    if (!res.ok) return;
    toast('Consent recorded');
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title="Record informed consent" onSubmit={save} loading={submit.loading} error={submit.error} submitLabel="Save consent">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select label="Consent status" name="status" options={CONSENT_STATUSES} value={v.status} onChange={on} />
        <Input label="Consent date" name="consent_date" type="date" max={todayISO()} value={v.consent_date} onChange={on} required={v.status === 'Signed'} />
        <Input label="Form version" name="consent_version" placeholder="e.g. ICF v2.0" value={v.consent_version} onChange={on} required={v.status === 'Signed'} />
      </div>
      <RecordPicker path="/documents" params={{ participant_id: e.participant_id, category: 'Informed Consent' }} name="document_id"
        label="Signed consent document" placeholder="None linked" value={v.document_id} onChange={on}
        labelOf={(d) => `${d.title} v${d.version} (${d.filename})`}
        hint="Upload the signed form under Documents (category: Informed Consent, linked to this participant) to select it here." />
      <TextArea label="Notes" name="notes" rows={2} value={v.notes} onChange={on} />
    </FormModal>
  );
}

function EnrollModal({ open, onClose, enrollment: e, onSaved }) {
  const [v, setV] = useState({});
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (open) {
      submit.reset();
      setV({ enrollment_date: todayISO(), arm: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    const res = await submit.run(() => enrollmentApi.enroll(e.id, { enrollment_date: v.enrollment_date, arm: v.arm || null }));
    if (!res.ok) return;
    toast(`${e.participant_code} enrolled — ${res.data.visits.length} visits scheduled`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} size="sm" title="Enroll participant" onSubmit={save} loading={submit.loading} error={submit.error}
      submitLabel="Confirm enrollment" submitVariant="success">
      <p className="font-body-md text-body-md">
        Enroll <Code>{e.participant_code}</Code> {e.participant_name} in <Code>{e.trial_code}</Code>.
      </p>
      <Input label="Enrollment date" name="enrollment_date" type="date" min={e.consent?.consent_date} max={todayISO()} value={v.enrollment_date}
        onChange={(ev) => setV((s) => ({ ...s, enrollment_date: ev.target.value }))} />
      <Input label="Study arm / cohort" name="arm" placeholder="Optional" value={v.arm} onChange={(ev) => setV((s) => ({ ...s, arm: ev.target.value }))} />
    </FormModal>
  );
}
