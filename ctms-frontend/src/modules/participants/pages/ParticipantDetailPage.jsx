import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ReasonModal from '../../../shared/components/ReasonModal.jsx';
import { useApi } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, DetailList, ErrorState, Page, PageHeader, Spinner, StatusBadge, Tabs } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime } from '../../../shared/utils/format.js';
import AETable from '../../adverse-events/components/AETable.jsx';
import DocumentsPanel from '../../documents/components/DocumentsPanel.jsx';
import EnrollmentTable from '../../enrollment/components/EnrollmentTable.jsx';
import VisitsTable from '../../visits/components/VisitsTable.jsx';
import ParticipantFormModal from '../components/ParticipantFormModal.jsx';
import { participantsApi } from '../services/participantsApi.js';

export default function ParticipantDetailPage() {
  const { id } = useParams();
  const can = usePermission();
  const [tab, setTab] = useState('profile');
  const [modal, setModal] = useState(null);
  const { data: p, loading, error, reload } = useApi(() => participantsApi.get(id), [id]);

  if (error) return <Page><ErrorState error={error} onRetry={reload} /></Page>;
  if (loading && !p) return <Page><Spinner /></Page>;

  const ec = p.emergency_contact || {};
  const editable = can('participants:write') && p.status !== 'Withdrawn';

  return (
    <Page>
      <PageHeader back={{ to: '/participants', label: 'All participants' }} title={p.full_name} badge={<StatusBadge status={p.status} />}
        subtitle={<><span className="font-data-mono text-primary-container font-semibold">{p.participant_code}</span> • {p.age} years • {p.sex}</>}
        actions={editable && (
          <>
            {can('enrollment:write') && <Button variant="secondary" icon="fact_check" to={`/enrollment?new=1&participant=${p.id}`}>Screen for trial</Button>}
            <Button variant="secondary" icon="edit" onClick={() => setModal('edit')}>Edit</Button>
            <Button variant="danger" icon="person_remove" onClick={() => setModal('withdraw')}>Withdraw</Button>
          </>
        )} />

      {p.status === 'Withdrawn' && (
        <div className="p-3 rounded-lg border-l-4 border-[#DC2626] bg-[#FEF2F2] font-body-md text-body-md text-[#B91C1C]">
          Withdrawn on {formatDateTime(p.withdrawn_at)}: {p.withdrawal_reason}. Historical records are retained and read-only.
        </div>
      )}

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'profile', label: 'Profile' },
        { id: 'enrollments', label: 'Enrollment history', count: p.enrollments.length },
        { id: 'visits', label: 'Visits' },
        { id: 'aes', label: 'Adverse events' },
        { id: 'documents', label: 'Documents' },
      ]} />

      {tab === 'profile' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Card title="Demographics & contact" className="xl:col-span-7">
            <DetailList items={[
              ['First name', p.first_name], ['Last name', p.last_name],
              ['Date of birth', formatDate(p.date_of_birth)], ['Sex', p.sex],
              ['Phone', p.phone], ['Email', p.email], ['Address', p.address, true],
              ['Registered', `${formatDateTime(p.created_at)} by ${p.created_by?.name}`, true],
            ]} />
          </Card>
          <Card title="Emergency contact" className="xl:col-span-5">
            <DetailList cols={1} items={[['Name', ec.name], ['Relationship', ec.relationship], ['Phone', ec.phone]]} />
          </Card>
          <Card title="Medical history" className="xl:col-span-12">
            <DetailList cols={3} items={[['Relevant medical history', p.medical_history], ['Allergies', p.allergies], ['Current medications', p.current_medications]]} />
          </Card>
        </div>
      )}
      {tab === 'enrollments' && <Card bodyClassName="p-0"><EnrollmentTable participantId={p.id} hideParticipant /></Card>}
      {tab === 'visits' && <Card bodyClassName="p-0"><VisitsTable filters={{ participant_id: p.id }} /></Card>}
      {tab === 'aes' && <Card bodyClassName="p-0"><AETable filters={{ participant_id: p.id }} /></Card>}
      {tab === 'documents' && <DocumentsPanel participantId={p.id} participantCode={p.participant_code} />}

      <ParticipantFormModal open={modal === 'edit'} onClose={() => setModal(null)} participant={p} onSaved={reload} />
      <ReasonModal open={modal === 'withdraw'} onClose={() => setModal(null)} title={`Withdraw ${p.participant_code}`}
        subtitle="Open screenings/enrollments are withdrawn and scheduled visits cancelled. Records are kept (BR-10)."
        label="Withdrawal reason" submitLabel="Withdraw participant" successMessage="Participant withdrawn"
        onConfirm={(reason) => participantsApi.withdraw(p.id, reason)} onDone={reload} />
    </Page>
  );
}
