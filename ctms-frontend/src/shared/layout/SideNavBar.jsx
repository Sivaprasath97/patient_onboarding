import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../modules/auth/context/AuthContext.jsx';
import BrandLogo, { BrandName } from '../components/BrandLogo.jsx';
import { usePermission } from '../hooks/usePermission.js';
import { initials } from '../utils/user.js';

const baseLink = 'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 active:scale-[0.99]';
const activeLink = 'bg-primary-fixed text-primary font-semibold shadow-[inset_3px_0_0_#2E9440]';
const idleLink = 'text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-on-surface';

export default function SideNavBar({ modules, open, onClose }) {
  const { user } = useAuth();
  const can = usePermission();
  const visible = modules.filter((m) => can(m.perm));

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop (mobile/tablet) */}
      <div onClick={onClose} aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#0F172A]/40 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <aside aria-label="Main navigation"
        className={`fixed top-0 left-0 h-full w-64 border-r border-outline-variant bg-surface-container-lowest z-50 flex flex-col justify-between p-4
          transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex items-center gap-3 px-1 pt-1 pb-3 border-b border-outline-variant">
            <BrandLogo size={40} />
            <BrandName subtitle={user?.role_label} />
            <button onClick={onClose} className="ml-auto p-1 rounded text-outline hover:bg-surface-container-low lg:hidden" aria-label="Close menu">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {can('ae:write') && (
            <Link to="/adverse-events"
              className="w-full flex items-center justify-center gap-2 bg-error text-on-error py-2 px-3 rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-on-error-container active:scale-[0.99] transition-all">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Log Adverse Event</span>
            </Link>
          )}

          <nav className="flex flex-col gap-0.5 overflow-y-auto min-h-0 pr-1 custom-scroll">
            {visible.map((m) => (
              <NavLink key={m.id} to={m.path} end={m.path === '/'} className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-primary-container' : m.danger ? 'text-error' : 'text-outline'}`}>{m.icon}</span>
                    <span className="font-label-md text-label-md">{m.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-3 border-t border-outline-variant">
          <Link to="/profile" className="mt-1 p-2 bg-surface-container-low hover:bg-surface-container rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-leaf-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">{initials(user?.full_name)}</div>
            <div className="overflow-hidden leading-tight">
              <div className="font-label-sm text-label-sm font-semibold text-on-surface truncate">{user?.full_name}</div>
              <div className="font-data-mono-sm text-data-mono-sm text-outline truncate">{user?.email}</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
