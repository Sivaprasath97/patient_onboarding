import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordPicker } from '../../../shared/components/Pickers.jsx';
import { useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DataTable, EmptyState, FilterSelect, Modal, Page, PageHeader, Pagination, SearchInput, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate, formatDateTime } from '../../../shared/utils/format.js';
import { assessmentsApi } from '../services/assessmentsApi.js';

export default function AssessmentsListPage() {
  const can = usePermission();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [pick, setPick] = useState(false);
  const [visitId, setVisitId] = useState('');
  const list = useList(assessmentsApi.list, { q: useDebounced(q), status });

  const columns = [
    { key: 'participant', label: 'Participant', render: (a) => <div><Code>{a.participant_code}</Code><div className="font-body-sm text-body-sm text-on-surface-variant">{a.participant_name}</div></div> },
    { key: 'trial_code', label: 'Trial', render: (a) => <Code>{a.trial_code}</Code> },
    { key: 'visit_name', label: 'Visit', render: (a) => <div>{a.visit_name}<div className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(a.visit_date)}</div></div> },
    { key: 'vitals', label: 'BP / HR', render: (a) => <span className="font-data-mono">{a.vitals?.systolic_bp ?? '—'}/{a.vitals?.diastolic_bp ?? '—'} • {a.vitals?.heart_rate ?? '—'}</span> },
    { key: 'labs', label: 'Labs', render: (a) => {
      const abn = (a.lab_results || []).filter((l) => l.flag === 'H' || l.flag === 'L').length;
      return <span className="font-data-mono">{(a.lab_results || []).length}{abn ? <span className="text-[#DC2626]"> ({abn} abnormal)</span> : ''}</span>;
    } },
    { key: 'status', label: 'Status', render: (a) => <div className="flex flex-col gap-1 items-start"><StatusBadge status={a.status} />{a.status === 'Draft' && a.missing_fields?.length > 0 && <span className="font-label-sm text-label-sm text-[#B45309]">{a.missing_fields.length} REQUIRED MISSING</span>}</div> },
    { key: 'recorded_by', label: 'Recorded', render: (a) => <div className="font-body-sm text-body-sm">{a.recorded_by?.name}<div className="text-outline">{formatDateTime(a.created_at)}</div></div> },
  ];

  return (
    <Page>
      <PageHeader title="Medical assessments" subtitle="Vital signs, examinations, laboratory results and investigator observations per visit."
        actions={can('assessments:write') && <Button icon="add" onClick={() => setPick(true)}>New assessment</Button>} />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search participant, visit, trial…" />
          <FilterSelect value={status} onChange={setStatus} options={['Draft', 'Finalized']} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
          onRowClick={(a) => navigate(`/assessments/${a.id}`)} empty={<EmptyState icon="stethoscope" title="No assessments recorded" message="Assessments are recorded against a visit." />} />
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>

      <Modal open={pick} onClose={() => setPick(false)} title="Select a visit" size="md"
        footer={<><Button variant="secondary" onClick={() => setPick(false)}>Cancel</Button><Button disabled={!visitId} onClick={() => navigate(`/assessments/new?visit=${visitId}`)}>Continue</Button></>}>
        <RecordPicker path="/visits" params={{ status: 'Completed' }} label="Completed visit" placeholder="Select a visit…" name="visit"
          value={visitId} onChange={(e) => setVisitId(e.target.value)}
          labelOf={(v) => `${v.participant_code} ${v.participant_name} — ${v.visit_name} (${v.completed_date || v.scheduled_date}) • ${v.trial_code}`}
          hint="Complete the visit first under Visits & Calendar." />
      </Modal>
    </Page>
  );
}
