import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/context/AuthContext.jsx';
import { formatDateTime, initials } from '../utils/user.js';

/** Logged-in user's details in the top bar, with a dropdown and sign-out. */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  async function onLogout() {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  const rows = [
    ['mail', 'Email', user.email],
    ['assignment_ind', 'Role', user.role_label],
    ['domain', 'Site', user.site || '—'],
    ['call', 'Phone', user.phone || '—'],
    ['schedule', 'Last sign-in', formatDateTime(user.last_login_at)],
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-leaf-gradient text-white flex items-center justify-center font-label-lg text-label-lg font-semibold">
          {initials(user.full_name)}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight text-left">
          <span className="font-label-lg text-label-lg text-on-surface font-semibold max-w-[160px] truncate">
            {user.full_name}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{user.role_label}</span>
        </span>
        <span className="material-symbols-outlined text-outline text-lg">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-surface-container-lowest border border-outline-variant rounded-lg z-50 overflow-hidden"
          style={{ boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
        >
          <div className="p-4 flex items-center gap-3 border-b border-outline-variant bg-surface-container-low">
            <span className="w-11 h-11 rounded-full bg-leaf-gradient text-white flex items-center justify-center font-headline-sm text-headline-sm">
              {initials(user.full_name)}
            </span>
            <div className="min-w-0">
              <div className="font-headline-sm text-headline-sm text-on-surface truncate">{user.full_name}</div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider">
                {user.role_label}
              </span>
            </div>
          </div>
          <dl className="p-4 space-y-2.5">
            {rows.map(([icon, label, value]) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-outline text-lg">{icon}</span>
                <dt className="font-label-md text-label-md text-on-surface-variant w-20 shrink-0">{label}</dt>
                <dd className="font-body-md text-body-md text-on-surface truncate">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="p-2 border-t border-outline-variant">
            <button
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-primary-container">manage_accounts</span>
              My profile &amp; password
            </button>
            <button
              role="menuitem"
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-error font-label-lg text-label-lg hover:bg-error-container/40 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
