import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { useApi } from '../../../shared/hooks/useApi.js';
import { Card, Code, EmptyState, ErrorState, Page, PageHeader, Spinner, StatCard, StatusBadge } from '../../../shared/ui/index.js';
import { formatDate, humanize, timeAgo } from '../../../shared/utils/format.js';
import { dashboardApi } from '../services/dashboardApi.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => dashboardApi.get(), []);

  return (
    <Page>
      <PageHeader
        title={`${greeting()}, ${user.full_name.split(' ')[0]}`}
        subtitle={`Trial operations overview • ${user.role_label}${user.site ? ` • ${user.site}` : ''}`}
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Spinner />
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Clinical trials" value={data.trials.total} icon="clinical_notes" to="/trials"
              hint={`${data.trials.by_status.Active || 0} active • ${data.trials.by_status.Completed || 0} completed`} />
            <StatCard label="Registered participants" value={data.participants.total} icon="groups" tone="teal" to="/participants"
              hint={`${data.enrollment.by_status.Enrolled || 0} enrolled • ${data.enrollment.by_status.Screening || 0} in screening`} />
            <StatCard label="Visits" value={data.visits.today} icon="calendar_month" tone={data.visits.overdue ? 'amber' : 'primary'} to="/visits"
              hint={`today • ${data.visits.overdue} overdue`} />
            <StatCard label="Open adverse events" value={data.safety.open_aes} icon="warning" tone={data.safety.open_saes ? 'red' : 'slate'}
              to="/adverse-events" hint={`${data.safety.open_saes} serious (SAE)`} />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 space-y-5">
              <EnrollmentByTrial rows={data.enrollment.by_trial} />
              <EnrollmentTrend trend={data.enrollment.trend} />
              <UpcomingVisits visits={data.visits.upcoming} />
            </div>
            <div className="xl:col-span-4 space-y-5">
              <Tasks tasks={data.tasks} />
              <EnrollmentFunnel byStatus={data.enrollment.by_status} />
              <Activity items={data.activity} />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}

function EnrollmentByTrial({ rows }) {
  return (
    <Card title="Enrollment by active trial" icon="monitoring" actions={<Link to="/trials" className="font-label-lg text-label-lg text-primary-container hover:underline">All trials</Link>}>
      {!rows.length ? (
        <EmptyState icon="clinical_notes" title="No active trials" message="Activate a trial (with an active protocol) to start enrolling participants." />
      ) : (
        <div className="space-y-4">
          {rows.map((t) => {
            const pct = t.target ? Math.min(100, Math.round((100 * t.enrolled) / t.target)) : null;
            return (
              <Link to={`/trials/${t.id}`} key={t.id} className="block group">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Code>{t.trial_code}</Code>
                    <span className="font-body-md text-body-md text-on-surface truncate group-hover:text-primary-container">{t.title}</span>
                  </div>
                  <span className="font-data-mono text-data-mono text-on-surface-variant whitespace-nowrap">
                    {t.enrolled}{t.target ? ` / ${t.target}` : ''} enrolled • {t.screening} screening
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full" style={{ width: `${pct ?? (t.enrolled ? 100 : 0)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function EnrollmentTrend({ trend }) {
  const max = Math.max(1, ...trend.map((t) => t.count));
  return (
    <Card title="Enrollments per month" subtitle="Last 6 months" icon="bar_chart">
      <div className="flex items-end gap-3 h-40 pt-2">
        {trend.map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="font-data-mono text-data-mono text-on-surface">{t.count}</span>
            <div className="w-full max-w-[48px] rounded-t bg-primary-container/85" style={{ height: `${(t.count / max) * 100}%`, minHeight: t.count ? 4 : 2 }} />
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              {new Date(`${t.month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UpcomingVisits({ visits }) {
  return (
    <Card title="Upcoming visits" subtitle="Next 14 days" icon="event" bodyClassName="p-0"
      actions={<Link to="/visits" className="font-label-lg text-label-lg text-primary-container hover:underline">Open calendar</Link>}>
      {!visits.length ? (
        <EmptyState icon="event_available" title="No visits in the next 14 days" />
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center gap-4 px-4 py-2.5">
              <div className="w-12 text-center">
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  {new Date(`${v.scheduled_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}
                </div>
                <div className="font-headline-md text-headline-md text-on-surface">{v.scheduled_date.slice(8)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-label-lg text-label-lg text-on-surface truncate">{v.visit_name}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  <Code>{v.participant_code}</Code> {v.participant_name} • {v.trial_code}
                </div>
              </div>
              <StatusBadge status={v.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Tasks({ tasks }) {
  const icon = { critical: ['error', 'text-[#DC2626]'], warning: ['warning', 'text-[#D97706]'], info: ['task_alt', 'text-primary-container'] };
  return (
    <Card title="Your pending tasks" icon="checklist" bodyClassName="p-2">
      {!tasks.length ? (
        <EmptyState icon="done_all" title="You're all caught up" />
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t.title}>
              <Link to={t.link} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container-low">
                <span className={`material-symbols-outlined ${icon[t.kind][1]}`}>{icon[t.kind][0]}</span>
                <span className="flex-1 font-body-md text-body-md text-on-surface">{t.title}</span>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EnrollmentFunnel({ byStatus }) {
  const rows = ['Screening', 'Enrolled', 'Completed', 'Screen Failed', 'Withdrawn'];
  return (
    <Card title="Participant pipeline" icon="filter_alt">
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s} className="flex items-center justify-between">
            <StatusBadge status={s} />
            <span className="font-data-mono text-data-mono text-on-surface">{byStatus[s] || 0}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Activity({ items }) {
  return (
    <Card title="Recent activity" icon="history" bodyClassName="p-0">
      {!items.length ? (
        <EmptyState icon="history" title="No activity yet" />
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {items.map((a) => (
            <li key={a.id} className="px-4 py-2.5">
              <div className="font-body-md text-body-md text-on-surface">
                <span className="font-semibold">{a.user_name || a.email || 'System'}</span> — {humanize(a.action)}
                {a.entity_label && <span className="text-on-surface-variant"> • {a.entity_label}</span>}
              </div>
              <div className="font-data-mono-sm text-data-mono-sm text-outline" title={formatDate(a.timestamp)}>{timeAgo(a.timestamp)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
