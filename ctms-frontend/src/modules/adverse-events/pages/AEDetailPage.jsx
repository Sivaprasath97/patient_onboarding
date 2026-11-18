import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, DetailList, ErrorState, FormModal, Input, Page, PageHeader, Select, Spinner, StatusBadge, TextArea, Timeline, useToast } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime, humanize, todayISO } from '../../../shared/utils/format.js';
import RaiseQueryModal from '../../data-queries/components/RaiseQueryModal.jsx';
import AEFormModal from '../components/AEFormModal.jsx';
import { aeApi } from '../services/aeApi.js';

export default function AEDetailPage() {
  const { id } = useParams();
  const can = usePermission();
  const [modal, setModal] = useState(null);
  const { data: ae, loading, error, reload, setData } = useApi(() => aeApi.get(id), [id]);
  const { data: meta } = useApi(() => aeApi.meta(), []);

  if (error) return <Page><ErrorState error={error} onRetry={reload} /></Page>;
  if (loading && !ae) return <Page><Spinner /></Page>;
  const closed = ae.status === 'Closed';

  return (
    <Page>
      <PageHeader back={{ to: '/adverse-events', label: 'Adverse events' }} title={ae.term}
        badge={<><StatusBadge status={ae.status} />{ae.serious && <StatusBadge status="SAE">Serious</StatusBadge>}</>}
        subtitle={<>
          <span className="font-data-mono text-primary-container font-semibold">{ae.ae_code}</span> •{' '}
          <Link className="hover:underline" to={`/participants/${ae.participant_id}`}>{ae.participant_code} {ae.participant_name}</Link> • {ae.trial_code}
        </>}
        actions={<>
          {can('queries:raise') && <Button variant="secondary" icon="help" onClick={() => setModal('query')}>Raise query</Button>}
          {!closed && can('ae:write') && <Button variant="secondary" icon="edit" onClick={() => setModal('edit')}>Edit</Button>}
          {!closed && can('ae:write') && <Button variant="secondary" icon="add_comment" onClick={() => setModal('followup')}>Add follow-up</Button>}
          {!closed && can('ae:review') && <Button icon="rate_review" onClick={() => setModal('review')}>{ae.status === 'Reviewed' ? 'Re-review' : 'PI review'}</Button>}
          {ae.status === 'Reviewed' && can('ae:review') && <Button variant="success" icon="task_alt" onClick={() => setModal('close')}>Close event</Button>}
        </>} />

      {ae.status === 'Open' && (
        <div className="p-3 rounded-lg border-l-4 border-[#D97706] bg-[#FEF3C7] font-body-md text-body-md text-[#B45309]">
          Awaiting Principal Investigator review and causality assessment (BR-7).
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <Card title="Event details" icon="health_and_safety">
            <DetailList cols={3} items={[
              ['Severity', <StatusBadge key="s" status={ae.severity} />], ['Serious', ae.serious ? 'Yes' : 'No'], ['Causality', ae.causality],
              ['Onset date', formatDate(ae.onset_date)], ['Resolution date', formatDate(ae.resolution_date)], ['Outcome', <StatusBadge key="o" status={ae.outcome} dot={false} />],
              ae.serious && ['Seriousness criteria', ae.seriousness_criteria.join(', '), true],
              ['Description', ae.description, true], ['Action taken', ae.action_taken, true],
              ['Reported by', `${ae.reported_by?.name} • ${formatDateTime(ae.created_at)}`, true],
            ]} />
          </Card>
          <Card title="Follow-up information" icon="forum">
            <Timeline items={[...(ae.follow_ups || [])].reverse().map((f) => ({ title: formatDate(f.date), body: f.note, meta: `${f.by?.name} • ${formatDateTime(f.at)}` }))} />
          </Card>
        </div>
        <div className="xl:col-span-4 space-y-5">
          <Card title="PI review" icon="rate_review">
            {ae.reviewed_by ? (
              <DetailList cols={1} items={[['Causality', ae.causality], ['Comments', ae.review_comments], ['Reviewed by', `${ae.reviewed_by.name} • ${formatDateTime(ae.reviewed_at)}`]]} />
            ) : <p className="font-body-md text-body-md text-on-surface-variant">Not reviewed yet.</p>}
            {ae.closed_by && <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">Closed by {ae.closed_by.name} • {formatDateTime(ae.closed_at)}</p>}
          </Card>
          <Card title="Change history" icon="history">
            <Timeline items={(ae.history || []).map((h) => ({
              title: humanize(h.action.replace('ae.', '')),
              body: Object.entries(h.changes || {}).map(([k, c]) => `${humanize(k)}: ${c.from ?? '—'} → ${c.to ?? '—'}`).join('\n'),
              meta: `${h.user_name} • ${formatDateTime(h.timestamp)}`,
            }))} />
          </Card>
        </div>
      </div>

      <AEFormModal open={modal === 'edit'} onClose={() => setModal(null)} ae={ae} onSaved={reload} />
      <FollowUpModal open={modal === 'followup'} onClose={() => setModal(null)} ae={ae} onSaved={setData} />
      <ReviewModal open={modal === 'review'} onClose={() => setModal(null)} ae={ae} meta={meta} onSaved={setData} />
      <CloseModal open={modal === 'close'} onClose={() => setModal(null)} ae={ae} meta={meta} onSaved={setData} />
      <RaiseQueryModal open={modal === 'query'} onClose={() => setModal(null)} preset={{ entity_type: 'adverse_event', entity_id: ae.id, label: `${ae.ae_code} ${ae.term}` }} />
    </Page>
  );
}

function useModalForm(open, initial) {
  const [v, setV] = useState(initial);
  const submit = useSubmit();
  useEffect(() => {
    if (open) { setV(initial); submit.reset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));
  return { v, on, submit };
}

function FollowUpModal({ open, onClose, ae, onSaved }) {
  const { v, on, submit } = useModalForm(open, { date: todayISO(), note: '' });
  const toast = useToast();
  return (
    <FormModal open={open} onClose={onClose} title="Add follow-up" size="sm" loading={submit.loading} error={submit.error} submitLabel="Add"
      onSubmit={async () => {
        if (v.note.trim().length < 3) return submit.setError('Enter the follow-up note.');
        const res = await submit.run(() => aeApi.followUp(ae.id, { date: v.date, note: v.note.trim() }));
        if (res.ok) { toast('Follow-up added'); onSaved(res.data); onClose(); }
      }}>
      <Input label="Date" name="date" type="date" max={todayISO()} value={v.date} onChange={on} />
      <TextArea label="Follow-up note" name="note" required rows={4} value={v.note} onChange={on} />
    </FormModal>
  );
}

function ReviewModal({ open, onClose, ae, meta, onSaved }) {
  const { v, on, submit } = useModalForm(open, { causality: ae.causality === 'Not assessed' ? '' : ae.causality, comments: ae.review_comments || '' });
  const toast = useToast();
  return (
    <FormModal open={open} onClose={onClose} title="Principal Investigator review" loading={submit.loading} error={submit.error} submitLabel="Submit review"
      onSubmit={async () => {
        if (!v.causality || v.comments.trim().length < 3) return submit.setError('Select causality and enter review comments.');
        const res = await submit.run(() => aeApi.review(ae.id, { causality: v.causality, comments: v.comments.trim() }));
        if (res.ok) { toast('Review recorded'); onSaved(res.data); onClose(); }
      }}>
      <Select label="Causality assessment" name="causality" required placeholder="Select…" value={v.causality} onChange={on}
        options={(meta?.causality || []).filter((c) => c !== 'Not assessed')} />
      <TextArea label="Review comments" name="comments" required rows={4} value={v.comments} onChange={on} />
    </FormModal>
  );
}

function CloseModal({ open, onClose, ae, meta, onSaved }) {
  const { v, on, submit } = useModalForm(open, { outcome: ae.outcome === 'Ongoing' ? '' : ae.outcome, resolution_date: ae.resolution_date || todayISO() });
  const toast = useToast();
  return (
    <FormModal open={open} onClose={onClose} title={`Close ${ae.ae_code}`} size="sm" loading={submit.loading} error={submit.error} submitLabel="Close event" submitVariant="success"
      onSubmit={async () => {
        if (!v.outcome) return submit.setError('Select the final outcome.');
        const res = await submit.run(() => aeApi.close(ae.id, { outcome: v.outcome, resolution_date: v.resolution_date || null }));
        if (res.ok) { toast('Adverse event closed'); onSaved(res.data); onClose(); }
      }}>
      <Select label="Final outcome" name="outcome" required placeholder="Select…" value={v.outcome} onChange={on} options={(meta?.outcome || []).filter((o) => o !== 'Ongoing')} />
      <Input label="Resolution date" name="resolution_date" type="date" min={ae.onset_date} max={todayISO()} value={v.resolution_date} onChange={on} />
    </FormModal>
  );
}
