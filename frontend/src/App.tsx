import { HashRouter, Route, Routes } from 'react-router-dom';
import { LogsPage } from './pages/LogsPage';
import { RoastingMethodsPage } from './pages/RoastingMethodsPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LogsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/roasting-methods" element={<RoastingMethodsPage />} />
        <Route path="*" element={<LogsPage />} />
      </Routes>
    </HashRouter>
  );
}
