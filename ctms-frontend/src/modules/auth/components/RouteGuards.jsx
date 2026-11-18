import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../../../shared/components/PageLoader.jsx';

/** Only signed-in users can see these routes. */
export function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Login/register pages: signed-in users are sent to the dashboard. */
export function PublicOnlyRoute() {
  const { isAuthenticated, status } = useAuth();
  if (status === 'loading') return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex bg-background">
      <PageLoader />
    </div>
  );
}
