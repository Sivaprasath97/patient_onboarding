import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, DetailList, ErrorState, Page, PageHeader, Spinner, StatCard, StatusBadge, Tabs, Timeline } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime } from '../../../shared/utils/format.js';
import DocumentsPanel from '../../documents/components/DocumentsPanel.jsx';
import EnrollmentTable from '../../enrollment/components/EnrollmentTable.jsx';
import DeviationsTab from '../components/DeviationsTab.jsx';
import ProtocolsTab from '../components/ProtocolsTab.jsx';
import StatusChangeModal from '../components/StatusChangeModal.jsx';
import TrialFormModal from '../components/TrialFormModal.jsx';
import { trialsApi } from '../services/trialsApi.js';

export default function TrialDetailPage() {
  const { id } = useParams();
  const can = usePermission();
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const { data: t, loading, error, reload } = useApi(() => trialsApi.get(id), [id]);

  if (error) return <Page><ErrorState error={error} onRetry={reload} /></Page>;
  if (loading && !t) return <Page><Spinner /></Page>;

  const counts = t.enrollment_counts || {};
  const enrolled = (counts.Enrolled || 0) + (counts.Completed || 0);
  const locked = ['Completed', 'Terminated'].includes(t.status);

  return (
    <Page>
      <PageHeader back={{ to: '/trials', label: 'All trials' }} title={t.title} badge={<StatusBadge status={t.status} />}
        subtitle={<><span className="font-data-mono text-primary-container font-semibold">{t.trial_code}</span> • {t.phase} • {t.study_type}{t.sponsor ? ` • ${t.sponsor}` : ''}</>}
        actions={can('trials:write') && !locked && (
          <>
            <Button variant="secondary" icon="edit" onClick={() => setModal('edit')}>Edit</Button>
            <Button icon="swap_horiz" onClick={() => setModal('status')}>Change status</Button>
          </>
        )} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled" value={enrolled} icon="how_to_reg" hint={t.target_enrollment ? `of ${t.target_enrollment} target` : 'No target set'} />
        <StatCard label="In screening" value={counts.Screening || 0} icon="fact_check" tone="amber" />
        <StatCard label="Screen failed / withdrawn" value={(counts['Screen Failed'] || 0) + (counts.Withdrawn || 0)} icon="person_off" tone="slate" />
        <StatCard label="Active protocol" value={t.active_protocol ? `v${t.active_protocol.version}` : 'None'} icon="description" tone={t.active_protocol ? 'teal' : 'red'} />
      </section>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'protocols', label: 'Protocols' },
        { id: 'participants', label: 'Participants', count: Object.values(counts).reduce((a, b) => a + b, 0) },
        { id: 'deviations', label: 'Deviations' },
        { id: 'documents', label: 'Documents' },
      ]} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Card title="Trial information" className="xl:col-span-8">
            <DetailList items={[
              ['Trial ID', t.trial_code], ['Status', <StatusBadge key="s" status={t.status} />],
              ['Phase', t.phase], ['Study type', t.study_type],
              ['Therapeutic area', t.therapeutic_area], ['Sponsor', t.sponsor],
              ['Start date', formatDate(t.start_date)], ['End date', formatDate(t.end_date)],
              ['Target enrollment', t.target_enrollment], ['Created', `${formatDateTime(t.created_at)} by ${t.created_by?.name}`],
              ['Description', t.description, true], ['Objectives & research details', t.objectives, true],
            ]} />
          </Card>
          <div className="xl:col-span-4 space-y-5">
            <Card title="Research team" icon="group">
              <ul className="space-y-2.5">
                {t.pi && <Person name={t.pi.name} role="Principal Investigator" lead />}
                {t.team.map((m) => <Person key={m.id} name={m.name} role={m.role.replace(/_/g, ' ')} />)}
                {!t.pi && !t.team.length && <p className="font-body-md text-body-md text-on-surface-variant">No team assigned.</p>}
              </ul>
            </Card>
            <Card title="Status history" icon="timeline">
              <Timeline items={[...(t.status_history || [])].reverse().map((h) => ({
                title: h.status, body: h.reason, meta: `${formatDateTime(h.at)} • ${h.by?.name}`,
              }))} />
            </Card>
          </div>
        </div>
      )}
      {tab === 'protocols' && <ProtocolsTab trial={t} onChanged={reload} />}
      {tab === 'participants' && (
        <Card title="Screening & enrollment" bodyClassName="p-0"
          actions={can('enrollment:write') && t.status === 'Active' && <Button size="sm" icon="person_add" to={`/enrollment?new=1&trial=${t.id}`}>Screen participant</Button>}>
          <EnrollmentTable trialId={t.id} hideTrial />
        </Card>
      )}
      {tab === 'deviations' && <DeviationsTab trial={t} />}
      {tab === 'documents' && <DocumentsPanel trialId={t.id} trialCode={t.trial_code} />}

      <TrialFormModal open={modal === 'edit'} onClose={() => setModal(null)} trial={t} onSaved={reload} />
      <StatusChangeModal open={modal === 'status'} onClose={() => setModal(null)} trial={t} onSaved={reload} />
    </Page>
  );
}

function Person({ name, role, lead }) {
  const initials = name.replace(/^dr\.?\s+/i, '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <li className="flex items-center gap-3">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${lead ? 'bg-primary-container text-on-primary' : 'bg-primary-fixed text-primary'}`}>{initials}</span>
      <div>
        <div className="font-label-lg text-label-lg text-on-surface">{name}</div>
        <div className="font-body-sm text-body-sm text-on-surface-variant capitalize">{role}</div>
      </div>
    </li>
  );
}
