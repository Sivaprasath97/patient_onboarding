import { useNavigate } from 'react-router-dom';
import { useList } from '../../../shared/hooks/useApi.js';
import { Code, DataTable, EmptyState, Pagination, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate } from '../../../shared/utils/format.js';
import { aeApi } from '../services/aeApi.js';

export default function AETable({ filters = {} }) {
  const navigate = useNavigate();
  const list = useList(aeApi.list, filters);
  const columns = [
    { key: 'ae_code', label: 'AE ID', render: (a) => <Code>{a.ae_code}</Code> },
    { key: 'term', label: 'Event', render: (a) => <div className="max-w-xs"><div className="font-label-lg text-label-lg truncate">{a.term}</div>{a.serious && <StatusBadge status="SAE" className="mt-1">Serious</StatusBadge>}</div> },
    { key: 'participant', label: 'Participant', render: (a) => <div><Code>{a.participant_code}</Code><div className="font-body-sm text-body-sm text-on-surface-variant">{a.trial_code}</div></div> },
    { key: 'onset_date', label: 'Onset', render: (a) => formatDate(a.onset_date) },
    { key: 'severity', label: 'Severity', render: (a) => <StatusBadge status={a.severity} /> },
    { key: 'causality', label: 'Causality' },
    { key: 'outcome', label: 'Outcome', render: (a) => <StatusBadge status={a.outcome} dot={false} /> },
    { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
  ];
  return (
    <>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
        onRowClick={(a) => navigate(`/adverse-events/${a.id}`)}
        rowClassName={(a) => (a.serious && a.status !== 'Closed' ? 'border-l-4 border-l-[#DC2626]' : '')}
        empty={<EmptyState icon="health_and_safety" title="No adverse events" />} />
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
    </>
  );
}
