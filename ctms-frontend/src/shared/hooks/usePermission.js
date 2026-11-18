import { useAuth } from '../../modules/auth/context/AuthContext.jsx';

/** const can = usePermission(); can('trials:write') */
export function usePermission() {
  const { user } = useAuth();
  const perms = new Set(user?.permissions || []);
  return (perm) => !perm || perms.has(perm);
}
