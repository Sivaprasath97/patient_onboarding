import { useState } from 'react';
import { useApi } from '../../../shared/hooks/useApi.js';
import { Button, Spinner } from '../../../shared/ui/index.js';
import { todayISO } from '../../../shared/utils/format.js';
import { visitsApi } from '../services/visitsApi.js';

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const DOT = { Scheduled: 'bg-[#4338CA]', Completed: 'bg-[#23803A]', Missed: 'bg-[#DC2626]', Cancelled: 'bg-[#94A3B8]' };

/** Month calendar of visits. Click a visit to open its actions. */
export default function VisitCalendar({ filters = {}, onSelect, refreshKey }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = new Date(month);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday-start grid
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const from = iso(days[0]);
  const to = iso(days[41]);
  const key = JSON.stringify(filters);
  const { data, loading } = useApi(() => visitsApi.list({ ...filters, date_from: from, date_to: to, page_size: 200 }), [from, to, key, refreshKey]);
  const byDay = {};
  (data?.items || []).forEach((v) => { (byDay[v.scheduled_date] ||= []).push(v); });
  const today = todayISO();
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <h2 className="font-headline-md text-headline-md">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" icon="chevron_left" onClick={() => shift(-1)} aria-label="Previous month" />
          <Button size="sm" variant="secondary" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</Button>
          <Button size="sm" variant="secondary" icon="chevron_right" onClick={() => shift(1)} aria-label="Next month" />
        </div>
      </div>
      {loading && !data ? <Spinner /> : (
        <div className="grid grid-cols-7">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-2 py-1.5 font-label-md text-[11px] uppercase text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">{d}</div>
          ))}
          {days.map((d) => {
            const k = iso(d);
            const inMonth = d.getMonth() === month.getMonth();
            const items = byDay[k] || [];
            return (
              <div key={k} className={`min-h-[104px] border-b border-r border-[#F1F5F9] p-1.5 ${inMonth ? '' : 'bg-[#F8FAFC]'}`}>
                <div className={`font-data-mono text-data-mono mb-1 w-6 h-6 flex items-center justify-center rounded-full ${k === today ? 'bg-primary-container text-on-primary' : inMonth ? 'text-on-surface' : 'text-outline'}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((v) => (
                    <button key={v.id} onClick={() => onSelect?.(v)} title={`${v.participant_code} ${v.visit_name} (${v.status})`}
                      className={`w-full text-left px-1.5 py-0.5 rounded font-body-sm text-[11px] truncate flex items-center gap-1 ${v.is_overdue ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[v.status]}`} />
                      <span className="truncate">{v.participant_code} · {v.visit_name}</span>
                    </button>
                  ))}
                  {items.length > 3 && <div className="font-body-sm text-[11px] text-on-surface-variant px-1">+{items.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
