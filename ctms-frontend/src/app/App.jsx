import { Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from '../shared/layout/AppLayout.jsx';
import ErrorBoundary from '../shared/components/ErrorBoundary.jsx';
import NotFound from '../shared/components/NotFound.jsx';
import PageLoader from '../shared/components/PageLoader.jsx';
import { usePermission } from '../shared/hooks/usePermission.js';
import { ErrorState, Page } from '../shared/ui/index.js';
import { ProtectedRoute, PublicOnlyRoute } from '../modules/auth/components/RouteGuards.jsx';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage.jsx';
import LoginPage from '../modules/auth/pages/LoginPage.jsx';
import ProfilePage from '../modules/auth/pages/ProfilePage.jsx';
import RegisterPage from '../modules/auth/pages/RegisterPage.jsx';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage.jsx';
import { MODULES } from './modules.js';

function Guarded({ perm, page: PageComponent }) {
  const can = usePermission();
  const { pathname } = useLocation();
  if (!can(perm)) return <Page><ErrorState error={{ status: 403 }} /></Page>;
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <PageComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public: only when signed out */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      {/* Reachable signed in or out (link arrives by email) */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected: requires sign-in; each module route also checks the module permission */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout modules={MODULES} />}>
          {MODULES.flatMap((m) =>
            m.routes.map((r) => <Route key={r.path} path={r.path} element={<Guarded perm={m.perm} page={r.page} />} />),
          )}
          <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
