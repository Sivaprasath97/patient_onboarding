import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNavBar from './SideNavBar.jsx';
import TopNavBar from './TopNavBar.jsx';

/** App frame: fixed sidebar on desktop (≥1024px), slide-out drawer on tablet/mobile. */
export default function AppLayout({ modules }) {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setNavOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-background text-on-surface antialiased">
      <SideNavBar modules={modules} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 bg-background">
        <TopNavBar modules={modules} onMenu={() => setNavOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}
