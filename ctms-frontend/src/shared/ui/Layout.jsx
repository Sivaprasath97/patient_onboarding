// Page-level building blocks: page header, cards, tabs, stat cards, detail lists, empty/error states.
import { Link } from 'react-router-dom';

export function Page({ children, className = '' }) {
  return <main className={`flex-1 p-4 sm:p-6 space-y-5 w-full max-w-[1600px] mx-auto ${className}`}>{children}</main>;
}

export function PageHeader({ title, subtitle, actions, back, badge }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-md text-label-md mb-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {back.label}
          </Link>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-headline-xl text-headline-xl text-on-surface">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="font-body-md text-body-md text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4', icon }) {
  return (
    <section className={`bg-surface-container-lowest border border-[#E2E8F0] rounded-xl ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="material-symbols-outlined text-primary-container text-[20px]">{icon}</span>}
            <div className="min-w-0">
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{title}</h2>
              {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon, tone = 'primary', hint, to }) {
  const tones = {
    primary: 'bg-primary-fixed text-primary-container',
    teal: 'bg-[#EEF8EF] text-[#23803A]',
    amber: 'bg-[#FEF3C7] text-[#D97706]',
    red: 'bg-[#FEF2F2] text-[#DC2626]',
    slate: 'bg-[#F1F5F9] text-[#475569]',
  };
  const body = (
    <div className="bg-surface-container-lowest border border-[#E2E8F0] rounded-xl p-4 flex items-start justify-between gap-3 hover:border-primary-container transition-colors h-full">
      <div>
        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.04em]">{label}</div>
        <div className="font-display-lg text-[30px] leading-9 font-semibold text-on-surface mt-1 tabular-nums">{value ?? '—'}</div>
        {hint && <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">{hint}</div>}
      </div>
      {icon && (
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      )}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-6 border-b border-[#E2E8F0] overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-2.5 pt-1 font-label-lg text-label-lg whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            active === t.id ? 'border-primary-container text-primary-container font-semibold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t.label}
          {t.count != null && (
            <span className="px-1.5 rounded-full bg-surface-container text-primary font-data-mono-sm text-data-mono-sm">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function DetailList({ items, cols = 2 }) {
  return (
    <dl className={`grid grid-cols-1 ${cols === 3 ? 'md:grid-cols-3' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-x-6 gap-y-3`}>
      {items
        .filter(Boolean)
        .map(([label, value, wide]) => (
          <div key={label} className={wide ? 'md:col-span-full' : ''}>
            <dt className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.04em]">{label}</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-0.5 whitespace-pre-wrap break-words">{value ?? '—'}</dd>
          </div>
        ))}
    </dl>
  );
}

export function EmptyState({ icon = 'inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
      <span className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-primary-container">{icon}</span>
      </span>
      <div className="font-headline-sm text-headline-sm text-on-surface">{title}</div>
      {message && <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  if (error?.status === 501) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-fixed-dim bg-primary-fixed text-primary">
        <span className="material-symbols-outlined">construction</span>
        <div className="flex-1 font-body-md text-body-md">
          <b>Coming in a later phase.</b> {error.message}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]">
      <span className="material-symbols-outlined">error</span>
      <div className="flex-1 font-body-md text-body-md">
        {error?.status === 403 ? "You don't have permission to view this." : error?.message || 'Something went wrong.'}
      </div>
      {onRetry && error?.status !== 403 && (
        <button onClick={onRetry} className="font-label-lg text-label-lg underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-on-surface-variant font-body-md text-body-md">
      <span className="material-symbols-outlined animate-spin text-primary-container">progress_activity</span>
      {label}
    </div>
  );
}

export function Timeline({ items }) {
  if (!items?.length) return <p className="font-body-md text-body-md text-on-surface-variant">No entries yet.</p>;
  return (
    <ol className="relative border-l border-[#E2E8F0] ml-2 space-y-4">
      {items.map((it, i) => (
        <li key={i} className="ml-4">
          <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary-container ring-4 ring-surface-container-lowest" />
          <div className="font-label-lg text-label-lg text-on-surface">{it.title}</div>
          {it.body && <div className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap">{it.body}</div>}
          <div className="font-data-mono-sm text-data-mono-sm text-outline mt-0.5">{it.meta}</div>
        </li>
      ))}
    </ol>
  );
}
