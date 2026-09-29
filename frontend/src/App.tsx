import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthPage } from './pages/AuthPage';
import { LogsPage } from './pages/LogsPage';
import { RoastingMethodsPage } from './pages/RoastingMethodsPage';
import { BrewingMethodsPage } from './pages/BrewingMethodsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'anon') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<RequireAuth><LogsPage /></RequireAuth>} />
          <Route path="/logs" element={<RequireAuth><LogsPage /></RequireAuth>} />
          <Route path="/roasting-methods" element={<RequireAuth><RoastingMethodsPage /></RequireAuth>} />
          <Route path="/brewing-methods" element={<RequireAuth><BrewingMethodsPage /></RequireAuth>} />
          <Route path="*" element={<RequireAuth><LogsPage /></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
