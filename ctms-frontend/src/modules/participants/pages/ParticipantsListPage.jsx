import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DataTable, EmptyState, FilterSelect, Page, PageHeader, Pagination, SearchInput, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate } from '../../../shared/utils/format.js';
import ParticipantFormModal from '../components/ParticipantFormModal.jsx';
import { participantsApi } from '../services/participantsApi.js';

export default function ParticipantsListPage() {
  const can = usePermission();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState('');
  useEffect(() => { if (params.get('q') !== null) setQ(params.get('q')); }, [params]);
  const [open, setOpen] = useState(false);
  const list = useList(participantsApi.list, { q: useDebounced(q), status });

  const columns = [
    { key: 'participant_code', label: 'Participant ID', render: (p) => <Code>{p.participant_code}</Code> },
    { key: 'full_name', label: 'Name', render: (p) => <span className="font-label-lg text-label-lg">{p.full_name}</span> },
    { key: 'age', label: 'Age / Sex', render: (p) => `${p.age} • ${p.sex}` },
    { key: 'date_of_birth', label: 'Date of birth', render: (p) => formatDate(p.date_of_birth) },
    { key: 'phone', label: 'Phone', render: (p) => p.phone || '—' },
    { key: 'created_at', label: 'Registered', render: (p) => formatDate(p.created_at) },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <Page>
      <PageHeader title="Participants" subtitle="Central participant registry: demographics, contacts and medical history."
        actions={can('participants:write') && <Button icon="person_add" onClick={() => setOpen(true)}>Register participant</Button>} />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search ID, name, phone…" />
          <FilterSelect value={status} onChange={setStatus} options={['Active', 'Withdrawn']} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
          onRowClick={(p) => navigate(`/participants/${p.id}`)}
          empty={<EmptyState icon="groups" title="No participants found"
            action={can('participants:write') && <Button icon="person_add" onClick={() => setOpen(true)}>Register participant</Button>} />} />
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>
      <ParticipantFormModal open={open} onClose={() => setOpen(false)} onSaved={(p) => navigate(`/participants/${p.id}`)} />
    </Page>
  );
}
