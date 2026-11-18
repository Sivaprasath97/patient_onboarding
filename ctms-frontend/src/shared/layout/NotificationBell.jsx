import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { timeAgo } from '../utils/format.js';

const KIND = {
  critical: ['emergency', 'text-[#DC2626]'],
  warning: ['warning', 'text-[#D97706]'],
  info: ['info', 'text-primary-container'],
};

/** Notifications & alerts (SRD §4.13). Polls every 60s. */
export default function NotificationBell() {
  const [data, setData] = useState({ items: [], unread: 0, alerts: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(() => api('/notifications').then(setData).catch(() => {}), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (!open) return;
    load();
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, load]);

  async function openItem(n) {
    if (!n.read) await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    setOpen(false);
    load();
    if (n.link) navigate(n.link);
  }
  async function readAll() {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    load();
  }

  const badge = data.unread + data.alerts.filter((a) => a.kind === 'critical').length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title="Notifications" aria-label="Notifications"
        className="relative p-1.5 text-outline hover:text-on-surface rounded hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined text-xl">notifications</span>
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error text-on-error rounded-full font-label-sm text-[10px] flex items-center justify-center ring-2 ring-surface-container-lowest">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] bg-surface-container-lowest border border-outline-variant rounded-lg z-50 overflow-hidden"
          style={{ boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <span className="font-headline-sm text-headline-sm">Notifications</span>
            {data.unread > 0 && <button onClick={readAll} className="font-label-lg text-label-lg text-primary-container hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-[420px] overflow-y-auto custom-scroll">
            {data.alerts.length > 0 && (
              <div className="p-2 border-b border-outline-variant bg-[#F8FAFC]">
                <div className="px-2 py-1 font-label-md text-label-md uppercase text-on-surface-variant">Alerts</div>
                {data.alerts.map((a) => (
                  <button key={a.title} onClick={() => { setOpen(false); navigate(a.link); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low text-left">
                    <span className={`material-symbols-outlined text-[18px] ${KIND[a.kind][1]}`}>{KIND[a.kind][0]}</span>
                    <span className="font-body-md text-body-md">{a.title}</span>
                  </button>
                ))}
              </div>
            )}
            {!data.items.length ? (
              <p className="p-6 text-center font-body-md text-body-md text-on-surface-variant">No notifications yet.</p>
            ) : (
              data.items.map((n) => (
                <button key={n.id} onClick={() => openItem(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[#F1F5F9] hover:bg-surface-container-low ${n.read ? '' : 'bg-primary-fixed/40'}`}>
                  <span className={`material-symbols-outlined text-[20px] mt-0.5 ${KIND[n.kind]?.[1] || KIND.info[1]}`}>{KIND[n.kind]?.[0] || 'info'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-label-lg text-label-lg text-on-surface">{n.title}</span>
                    <span className="block font-body-sm text-body-sm text-on-surface-variant">{n.message}</span>
                    <span className="block font-data-mono-sm text-data-mono-sm text-outline mt-0.5">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-container mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
