import { useState } from 'react';
import { useApi, useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Checkbox, Code, DataTable, EmptyState, Page, PageHeader, Pagination, SearchInput, StatusBadge, Tabs } from '../../../shared/ui/index.js';
import { formatDateTime, humanize, timeAgo } from '../../../shared/utils/format.js';
import QueryDetailModal from '../components/QueryDetailModal.jsx';
import RaiseQueryModal from '../components/RaiseQueryModal.jsx';
import { queriesApi } from '../services/queriesApi.js';

export default function QueriesPage() {
  const can = usePermission();
  const [tab, setTab] = useState('Open');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(false);
  const [raise, setRaise] = useState(false);
  const [selected, setSelected] = useState(null);
  const { data: summary, reload: reloadSummary } = useApi(() => queriesApi.summary(), []);
  const list = useList(queriesApi.list, { q: useDebounced(q), status: tab === 'All' ? '' : tab, mine: mine || '' });
  const changed = () => { list.reload(); reloadSummary(); };

  const columns = [
    { key: 'query_code', label: 'Query', render: (r) => <Code>{r.query_code}</Code> },
    { key: 'question', label: 'Question', render: (r) => <div className="max-w-md"><div className="truncate font-label-lg text-label-lg">{r.question}</div><div className="font-body-sm text-body-sm text-on-surface-variant">{humanize(r.entity_type)}: {r.entity_label}{r.field ? ` • ${r.field}` : ''}</div></div> },
    { key: 'priority', label: 'Priority', render: (r) => <StatusBadge status={r.priority} dot={false} /> },
    { key: 'assigned_to', label: 'Assigned to', render: (r) => r.assigned_to?.name || <span className="text-outline">Unassigned</span> },
    { key: 'raised_by', label: 'Raised by', render: (r) => <div>{r.raised_by?.name}<div className="font-body-sm text-body-sm text-outline" title={formatDateTime(r.created_at)}>{timeAgo(r.created_at)}</div></div> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <Page>
      <PageHeader title="Data queries" subtitle="Identify and resolve missing or inconsistent clinical data."
        actions={can('queries:raise') && <Button icon="add_comment" onClick={() => setRaise(true)}>Raise query</Button>} />
      <Tabs active={tab} onChange={setTab} tabs={['Open', 'Answered', 'Closed', 'All'].map((s) => ({
        id: s, label: s, count: s === 'All' ? undefined : summary?.[s] || 0,
      }))} />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-4 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search query, record, participant…" />
          <Checkbox label="Only queries raised by or assigned to me" checked={mine} onChange={(e) => setMine(e.target.checked)} />
        </div>
        <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
          onRowClick={setSelected} empty={<EmptyState icon="help_center" title={`No ${tab === 'All' ? '' : tab.toLowerCase()} queries`} />} />
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>
      <RaiseQueryModal open={raise} onClose={() => setRaise(false)} onSaved={changed} />
      <QueryDetailModal query={selected} onClose={() => setSelected(null)} onChanged={changed} />
    </Page>
  );
}
