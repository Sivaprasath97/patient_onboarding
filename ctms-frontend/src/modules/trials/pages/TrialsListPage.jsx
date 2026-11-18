import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DataTable, EmptyState, FilterSelect, Page, PageHeader, Pagination, SearchInput, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate } from '../../../shared/utils/format.js';
import TrialFormModal from '../components/TrialFormModal.jsx';
import { TRIAL_STATUSES, trialsApi } from '../services/trialsApi.js';

export default function TrialsListPage() {
  const can = usePermission();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const list = useList(trialsApi.list, { q: useDebounced(q), status });

  const columns = [
    { key: 'trial_code', label: 'Trial ID', render: (t) => <Code>{t.trial_code}</Code> },
    { key: 'title', label: 'Title', render: (t) => <div className="max-w-sm"><div className="font-label-lg text-label-lg truncate">{t.title}</div><div className="font-body-sm text-body-sm text-on-surface-variant">{t.sponsor || t.therapeutic_area || '—'}</div></div> },
    { key: 'phase', label: 'Phase' },
    { key: 'study_type', label: 'Type' },
    { key: 'pi', label: 'Principal investigator', render: (t) => t.pi?.name || <span className="text-outline">Unassigned</span> },
    { key: 'enrolled', label: 'Enrolled', render: (t) => <span className="font-data-mono">{t.enrolled_count}{t.target_enrollment ? ` / ${t.target_enrollment}` : ''}</span> },
    { key: 'dates', label: 'Dates', render: (t) => <span className="font-data-mono-sm text-data-mono-sm whitespace-nowrap">{formatDate(t.start_date)} → {formatDate(t.end_date)}</span> },
    { key: 'status', label: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <Page>
      <PageHeader title="Clinical trials" subtitle="Create and manage studies, protocols, teams and trial status."
        actions={can('trials:write') && <Button icon="add" onClick={() => setOpen(true)}>New trial</Button>} />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search title, trial ID, sponsor…" />
          <FilterSelect value={status} onChange={setStatus} options={TRIAL_STATUSES} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
          onRowClick={(t) => navigate(`/trials/${t.id}`)}
          empty={<EmptyState icon="clinical_notes" title="No trials found" message={can('trials:write') ? 'Create your first clinical trial to get started.' : undefined}
            action={can('trials:write') && <Button icon="add" onClick={() => setOpen(true)}>New trial</Button>} />} />
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>
      <TrialFormModal open={open} onClose={() => setOpen(false)} onSaved={(t) => navigate(`/trials/${t.id}`)} />
    </Page>
  );
}
