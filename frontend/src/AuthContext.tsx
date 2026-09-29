import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearToken, getAccountEmail, getToken, setToken, UNAUTHORIZED_EVENT } from './api';

type AuthStatus = 'authed' | 'anon';

interface AuthState {
  status: AuthStatus;
  email: string | null;
  signIn: (token: string, email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seeded synchronously — no loading state, no mount-time fetch. A stale token is
  // discovered by the page's own data fetch 401ing, not verified up front here.
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'authed' : 'anon'));
  const [email, setEmail] = useState<string | null>(() => getAccountEmail());

  const signIn = useCallback((token: string, accountEmail: string) => {
    setToken(token, accountEmail);
    setEmail(accountEmail);
    setStatus('authed');
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setEmail(null);
    setStatus('anon');
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setEmail(null);
      setStatus('anon');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  return <AuthContext.Provider value={{ status, email, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
