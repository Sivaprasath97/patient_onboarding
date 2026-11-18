import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useDebounced } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, FilterSelect, Page, PageHeader, SearchInput } from '../../../shared/ui/index.js';
import EnrollmentTable from '../components/EnrollmentTable.jsx';
import StartScreeningModal from '../components/StartScreeningModal.jsx';
import { ENROLLMENT_STATUSES, enrollmentApi } from '../services/enrollmentApi.js';

const STAGES = [
  ['Screening', 'fact_check', 'text-[#D97706] bg-[#FEF3C7]'],
  ['Enrolled', 'how_to_reg', 'text-[#23803A] bg-[#EEF8EF]'],
  ['Completed', 'verified', 'text-primary-container bg-primary-fixed'],
  ['Screen Failed', 'block', 'text-[#DC2626] bg-[#FEF2F2]'],
  ['Withdrawn', 'person_off', 'text-[#475569] bg-[#F1F5F9]'],
];

export default function EnrollmentListPage() {
  const can = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [trialId, setTrialId] = useState('');
  const open = params.get('new') === '1';
  const { data: summary } = useApi(() => enrollmentApi.summary({ trial_id: trialId }), [trialId]);
  const dq = useDebounced(q);

  const closeModal = () => setParams({}, { replace: true });

  return (
    <Page>
      <PageHeader title="Participant enrollment" subtitle="Screening, eligibility verification, informed consent and enrollment."
        actions={can('enrollment:write') && <Button icon="person_add" onClick={() => setParams({ new: '1' })}>Start screening</Button>} />

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAGES.map(([s, icon, cls]) => (
          <button key={s} onClick={() => setStatus(status === s ? '' : s)}
            className={`text-left bg-surface-container-lowest border rounded-xl p-3 flex items-center gap-3 transition-colors ${status === s ? 'border-primary-container ring-2 ring-primary-container/10' : 'border-[#E2E8F0] hover:border-primary-container'}`}>
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls}`}><span className="material-symbols-outlined">{icon}</span></span>
            <div>
              <div className="font-headline-md text-headline-md tabular-nums">{summary?.[s] || 0}</div>
              <div className="font-label-md text-label-md text-on-surface-variant uppercase">{s}</div>
            </div>
          </button>
        ))}
      </section>

      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search participant or trial…" />
          <FilterSelect value={status} onChange={setStatus} options={ENROLLMENT_STATUSES} placeholder="All statuses" />
          <div className="w-72"><TrialPicker label={null} placeholder="All trials" value={trialId} onChange={(e) => setTrialId(e.target.value)} /></div>
        </div>
        <EnrollmentTable q={dq} status={status} trialId={trialId} />
      </Card>

      <StartScreeningModal open={open && can('enrollment:write')} onClose={closeModal}
        defaults={{ trial: params.get('trial'), participant: params.get('participant') }}
        onSaved={(e) => navigate(`/enrollment/${e.id}`)} />
    </Page>
  );
}
