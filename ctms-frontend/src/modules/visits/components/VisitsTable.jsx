import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Code, DataTable, EmptyState, Pagination, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate } from '../../../shared/utils/format.js';
import { visitsApi } from '../services/visitsApi.js';
import VisitActions from './VisitActions.jsx';

export default function VisitsTable({ filters = {}, onChanged }) {
  const can = usePermission();
  const [action, setAction] = useState(null);
  const list = useList(visitsApi.list, filters);
  const writable = can('visits:write');

  const columns = [
    { key: 'scheduled_date', label: 'Date', render: (v) => (
      <div className="whitespace-nowrap">
        <div className={`font-label-lg text-label-lg ${v.is_overdue ? 'text-[#DC2626]' : ''}`}>{formatDate(v.scheduled_date)}</div>
        <div className="font-data-mono-sm text-data-mono-sm text-outline">window {v.window_start?.slice(5)} → {v.window_end?.slice(5)}</div>
      </div>
    ) },
    { key: 'visit', label: 'Visit', render: (v) => <div><div className="font-label-lg text-label-lg">{v.visit_name}</div><div className="font-body-sm text-body-sm text-on-surface-variant">#{v.visit_number} • {v.visit_type}</div></div> },
    { key: 'participant', label: 'Participant', render: (v) => <Link to={`/enrollment/${v.enrollment_id}`} className="hover:underline"><Code>{v.participant_code}</Code> <span className="text-on-surface-variant">{v.participant_name}</span></Link> },
    { key: 'trial_code', label: 'Trial', render: (v) => <Code>{v.trial_code}</Code> },
    { key: 'status', label: 'Status', render: (v) => (
      <div className="flex flex-col gap-1 items-start">
        <StatusBadge status={v.is_overdue ? 'Overdue' : v.status} />
        {v.out_of_window && <span className="font-label-sm text-label-sm text-[#B45309]">OUT OF WINDOW</span>}
      </div>
    ) },
    { key: 'actions', label: '', align: 'right', render: (v) => (
      <div className="flex justify-end gap-1">
        {v.status === 'Completed' && can('assessments:write') && <Button size="sm" variant="ghost" icon="stethoscope" to={`/assessments/new?visit=${v.id}`}>Assess</Button>}
        {v.status === 'Scheduled' && writable && (
          <>
            <Button size="sm" variant="success" icon="check" onClick={() => setAction({ type: 'complete', visit: v })}>Complete</Button>
            <Button size="sm" variant="secondary" onClick={() => setAction({ type: 'reschedule', visit: v })}>Reschedule</Button>
            <Button size="sm" variant="secondary" onClick={() => setAction({ type: 'missed', visit: v })}>Missed</Button>
            <Button size="sm" variant="danger" onClick={() => setAction({ type: 'cancel', visit: v })}>Cancel</Button>
          </>
        )}
      </div>
    ) },
  ];

  return (
    <>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
        rowClassName={(v) => (v.is_overdue ? 'bg-[#FEF2F2]/40' : '')}
        empty={<EmptyState icon="event_available" title="No visits found" />} />
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      <VisitActions action={action} onClose={() => setAction(null)} onDone={() => { list.reload(); onChanged?.(); }} />
    </>
  );
}
