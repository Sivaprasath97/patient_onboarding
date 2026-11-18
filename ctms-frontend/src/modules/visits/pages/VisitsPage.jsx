import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useDebounced } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, FilterSelect, Modal, Page, PageHeader, SearchInput, StatCard, StatusBadge, Tabs } from '../../../shared/ui/index.js';
import { formatDate, todayISO } from '../../../shared/utils/format.js';
import VisitActions, { ScheduleVisitModal } from '../components/VisitActions.jsx';
import VisitCalendar from '../components/VisitCalendar.jsx';
import VisitsTable from '../components/VisitsTable.jsx';
import { VISIT_STATUSES, visitsApi } from '../services/visitsApi.js';

export default function VisitsPage() {
  const can = usePermission();
  const [params] = useSearchParams();
  const enrollment = params.get('enrollment') || undefined;
  const [view, setView] = useState(params.get('view') || 'upcoming');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [trialId, setTrialId] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const { data: s, reload: reloadSummary } = useApi(() => visitsApi.summary({ trial_id: trialId }), [trialId, refresh]);
  const dq = useDebounced(q);

  const base = { q: dq, trial_id: trialId, enrollment_id: enrollment };
  const filters = {
    upcoming: { ...base, status: 'Scheduled', date_from: todayISO() },
    overdue: { ...base, overdue: true },
    all: { ...base, status },
  }[view] || base;
  const changed = () => { setRefresh((n) => n + 1); reloadSummary(); };

  return (
    <Page>
      <PageHeader title="Visits & calendar" subtitle="Schedule, track and complete participant visits within protocol windows."
        actions={can('visits:write') && <Button icon="event" onClick={() => setScheduleOpen(true)}>Schedule visit</Button>} />

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Today" value={s?.today} icon="today" />
        <StatCard label="Next 7 days" value={s?.upcoming_7_days} icon="date_range" tone="teal" />
        <StatCard label="Overdue" value={s?.overdue} icon="schedule" tone={s?.overdue ? 'red' : 'slate'} />
        <StatCard label="Completed" value={s?.completed} icon="task_alt" tone="teal" />
        <StatCard label="Missed" value={s?.missed} icon="event_busy" tone="amber" />
      </section>

      <Tabs active={view} onChange={setView} tabs={[
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'overdue', label: 'Overdue', count: s?.overdue || undefined },
        { id: 'all', label: 'All visits' },
        { id: 'calendar', label: 'Calendar' },
      ]} />

      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          {view !== 'calendar' && <SearchInput value={q} onChange={setQ} placeholder="Search participant, visit, trial…" />}
          {view === 'all' && <FilterSelect value={status} onChange={setStatus} options={VISIT_STATUSES} placeholder="All statuses" />}
          <div className="w-72"><TrialPicker label={null} placeholder="All trials" value={trialId} onChange={(e) => setTrialId(e.target.value)} /></div>
          {enrollment && <span className="font-body-sm text-body-sm text-on-surface-variant">Filtered to one enrollment</span>}
        </div>
        {view === 'calendar' ? (
          <VisitCalendar filters={{ trial_id: trialId, enrollment_id: enrollment }} onSelect={setSelected} refreshKey={refresh} />
        ) : (
          <VisitsTable key={`${view}-${refresh}`} filters={filters} onChanged={changed} />
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.visit_name} size="sm"
        subtitle={selected && `${selected.participant_code} ${selected.participant_name} • ${selected.trial_code}`}>
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><StatusBadge status={selected.is_overdue ? 'Overdue' : selected.status} /></div>
            <p className="font-body-md text-body-md">Scheduled {formatDate(selected.scheduled_date)} • window {formatDate(selected.window_start)} – {formatDate(selected.window_end)}</p>
            {selected.status === 'Scheduled' && can('visits:write') && (
              <div className="flex flex-wrap gap-2">
                {['complete', 'reschedule', 'missed', 'cancel'].map((t) => (
                  <Button key={t} size="sm" variant={t === 'complete' ? 'success' : t === 'cancel' ? 'danger' : 'secondary'}
                    onClick={() => { setAction({ type: t, visit: selected }); setSelected(null); }}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            )}
            {selected.status === 'Completed' && can('assessments:write') && <Button size="sm" icon="stethoscope" to={`/assessments/new?visit=${selected.id}`}>Record assessment</Button>}
          </div>
        )}
      </Modal>
      <VisitActions action={action} onClose={() => setAction(null)} onDone={changed} />
      <ScheduleVisitModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} defaultEnrollment={enrollment} onDone={changed} />
    </Page>
  );
}
