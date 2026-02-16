import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { DashboardPage } from '@/pages/dashboard-page';
import { GamesPage } from '@/pages/games-page';
import { HabitsPage } from '@/pages/habits-page';
import { OpeningsPage } from '@/pages/openings-page';
import { SettingsPage } from '@/pages/settings-page';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
