import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/context/AuthContext.jsx';
import { USE_MOCK } from '../api/client.js';
import { usePermission } from '../hooks/usePermission.js';
import NotificationBell from './NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';

export default function TopNavBar({ modules, onMenu }) {
  const { user } = useAuth();
  const can = usePermission();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const current = modules.find((m) => (m.path === '/' ? pathname === '/' : pathname.startsWith(m.path)));

  function search(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/participants?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center gap-3 h-14 w-full px-3 sm:px-6 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <button onClick={onMenu} className="p-1.5 -ml-1 rounded text-on-surface-variant hover:bg-surface-container-low lg:hidden" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-brand-green text-xl hidden sm:inline" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
            {user?.site || 'Clinical Trial Management System'}
          </span>
        </div>
        {can('participants:read') && (
          <form onSubmit={search} className="relative w-72 hidden xl:block">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search participant ID or name…"
              className="w-full h-9 pl-9 pr-3 text-xs bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container text-on-surface placeholder-outline font-body-md" />
          </form>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {USE_MOCK && (
          <span title="Using in-browser demo data (VITE_USE_MOCK=true)"
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-container font-label-md text-label-md">
            <span className="material-symbols-outlined text-[14px]">science</span>Demo mode
          </span>
        )}
        {current && (
          <span className="hidden 2xl:inline px-2.5 py-1 bg-surface-container text-primary font-data-mono-sm text-data-mono-sm font-semibold rounded border border-outline-variant">
            {current.label}
          </span>
        )}
        {can('ae:write') && (
          <button onClick={() => navigate('/adverse-events')}
            className="hidden sm:flex px-2.5 py-1 bg-error-container text-on-error-container font-label-md text-label-md font-semibold rounded hover:bg-opacity-80 transition-colors items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            AE Report
          </button>
        )}
        <div className="h-6 w-[1px] bg-outline-variant mx-1 hidden sm:block" />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
