import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { tokenStore } from '../../../shared/api/client.js';
import { authApi } from '../services/authApi.js';

const AuthContext = createContext(null);

/** Sign out after this much inactivity (SRD §5.2 session management). */
export const IDLE_MINUTES = 30;
const REASON_KEY = 'ctms_logout_reason';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while restoring a saved session, then 'ready'
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'ready');

  const endSession = useCallback((reason) => {
    tokenStore.clear();
    setUser(null);
    if (reason) {
      try {
        sessionStorage.setItem(REASON_KEY, reason);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setStatus('ready'));
  }, []);

  // Any 401 from the API (expired / revoked token) signs the user out.
  useEffect(() => {
    const onUnauthorized = () => endSession('expired');
    window.addEventListener('ctms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ctms:unauthorized', onUnauthorized);
  }, [endSession]);

  // Idle timeout.
  const lastActive = useRef(Date.now());
  useEffect(() => {
    if (!user) return undefined;
    lastActive.current = Date.now();
    const bump = () => { lastActive.current = Date.now(); };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_MINUTES * 60000) {
        authApi.logout().catch(() => {});
        endSession('idle');
      }
    }, 30000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [user, endSession]);

  const startSession = useCallback(({ access_token, user: u }) => {
    tokenStore.set(access_token);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => startSession(await authApi.login(email, password)), [startSession]);
  const register = useCallback(async (data) => startSession(await authApi.register(data)), [startSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* token may already be invalid; sign out locally regardless */
    }
    endSession();
  }, [endSession]);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: !!user, login, register, logout, setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Why the last session ended (shown once on the login page). */
export function takeLogoutReason() {
  try {
    const r = sessionStorage.getItem(REASON_KEY);
    sessionStorage.removeItem(REASON_KEY);
    return r;
  } catch {
    return null;
  }
}
