import { HashRouter, Route, Routes } from 'react-router-dom';
import { LogsPage } from './pages/LogsPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LogsPage />} />
        <Route path="*" element={<LogsPage />} />
      </Routes>
    </HashRouter>
  );
}
