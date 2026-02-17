import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { DashboardPage } from '@/pages/dashboard-page';
import { GamesPage } from '@/pages/games-page';
import { HabitsPage } from '@/pages/habits-page';
import { OpeningsPage } from '@/pages/openings-page';
import { SettingsPage } from '@/pages/settings-page';
import { LandingPage } from './pages/landing-page';

export default function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      ouv
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
