import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useDebounced } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, FilterSelect, Page, PageHeader, SearchInput, StatCard } from '../../../shared/ui/index.js';
import AEFormModal from '../components/AEFormModal.jsx';
import AETable from '../components/AETable.jsx';
import { aeApi } from '../services/aeApi.js';

export default function AEListPage() {
  const can = usePermission();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [serious, setSerious] = useState('');
  const [trialId, setTrialId] = useState('');
  const [open, setOpen] = useState(false);
  const { data: s } = useApi(() => aeApi.summary({ trial_id: trialId }), [trialId]);
  const dq = useDebounced(q);

  return (
    <Page>
      <PageHeader title="Adverse events & safety" subtitle="Record, review and follow up adverse events. Every AE requires PI review (BR-7)."
        actions={can('ae:write') && <Button variant="solidDanger" icon="report" onClick={() => setOpen(true)}>Report adverse event</Button>} />

      {s?.serious_open > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg border-l-4 border-[#DC2626] bg-[#FEF2F2]">
          <span className="material-symbols-outlined text-[#DC2626]">emergency</span>
          <span className="font-body-md text-body-md text-[#B91C1C]"><b>{s.serious_open} open serious adverse event(s).</b> Ensure expedited reporting timelines are met.</span>
          <Button size="sm" variant="danger" className="ml-auto" onClick={() => setSerious('true')}>Show SAEs</Button>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total reported" value={s?.total} icon="list_alt" />
        <StatCard label="Open" value={s?.open} icon="pending" tone="amber" />
        <StatCard label="Awaiting PI review" value={s?.awaiting_review} icon="rate_review" tone={s?.awaiting_review ? 'red' : 'slate'} />
        <StatCard label="Open SAEs" value={s?.serious_open} icon="emergency" tone={s?.serious_open ? 'red' : 'slate'} />
      </section>

      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search AE ID, term, participant…" />
          <FilterSelect value={status} onChange={setStatus} options={['Open', 'Reviewed', 'Closed']} placeholder="All statuses" />
          <FilterSelect value={severity} onChange={setSeverity} options={['Mild', 'Moderate', 'Severe', 'Life-threatening', 'Death']} placeholder="All severities" />
          <FilterSelect value={serious} onChange={setSerious} options={[{ value: 'true', label: 'Serious only' }, { value: 'false', label: 'Non-serious' }]} placeholder="Serious & non-serious" />
          <div className="w-64"><TrialPicker label={null} placeholder="All trials" value={trialId} onChange={(e) => setTrialId(e.target.value)} /></div>
        </div>
        <AETable filters={{ q: dq, status, severity, serious, trial_id: trialId }} />
      </Card>
      <AEFormModal open={open} onClose={() => setOpen(false)} onSaved={(a) => navigate(`/adverse-events/${a.id}`)} />
    </Page>
  );
}
