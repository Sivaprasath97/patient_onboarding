import { useNavigate } from 'react-router-dom';
import { useList } from '../../../shared/hooks/useApi.js';
import { Code, DataTable, EmptyState, Pagination, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate } from '../../../shared/utils/format.js';
import { enrollmentApi } from '../services/enrollmentApi.js';

/** Reusable enrollment list (used on enrollment, trial and participant pages). */
export default function EnrollmentTable({ trialId, participantId, status, q, hideTrial, hideParticipant }) {
  const navigate = useNavigate();
  const list = useList(enrollmentApi.list, { trial_id: trialId, participant_id: participantId, status, q });

  const columns = [
    !hideParticipant && { key: 'participant', label: 'Participant', render: (e) => <div><Code>{e.participant_code}</Code><div className="font-body-sm text-body-sm text-on-surface-variant">{e.participant_name}</div></div> },
    !hideTrial && { key: 'trial', label: 'Trial', render: (e) => <div><Code>{e.trial_code}</Code><div className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[220px]">{e.trial_title}</div></div> },
    { key: 'screening_date', label: 'Screened', render: (e) => formatDate(e.screening_date) },
    { key: 'eligibility_result', label: 'Eligibility', render: (e) => <StatusBadge status={e.eligibility_result} /> },
    { key: 'consent', label: 'Consent', render: (e) => <StatusBadge status={e.consent?.status || 'Pending'} /> },
    { key: 'enrollment_date', label: 'Enrolled', render: (e) => formatDate(e.enrollment_date) },
    { key: 'status', label: 'Status', render: (e) => <StatusBadge status={e.status} /> },
  ].filter(Boolean);

  return (
    <>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
        onRowClick={(e) => navigate(`/enrollment/${e.id}`)}
        empty={<EmptyState icon="fact_check" title="No screenings or enrollments" />} />
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
    </>
  );
}
