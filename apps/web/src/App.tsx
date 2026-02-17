import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';

const AppShell = lazy(async () => ({
  default: (await import('@/components/app-shell')).AppShell
}));

const DashboardPage = lazy(async () => ({
  default: (await import('@/pages/dashboard-page')).DashboardPage
}));

const OpeningsPage = lazy(async () => ({
  default: (await import('@/pages/openings-page')).OpeningsPage
}));

const HabitsPage = lazy(async () => ({
  default: (await import('@/pages/habits-page')).HabitsPage
}));

const GamesPage = lazy(async () => ({
  default: (await import('@/pages/games-page')).GamesPage
}));

const SettingsPage = lazy(async () => ({
  default: (await import('@/pages/settings-page')).SettingsPage
}));

export default function App() {
  const withFallback = (element: ReactElement) => (
    <Suspense fallback={<RouteFallback />}>{element}</Suspense>
  );

  return (
    <Routes>
      <Route element={withFallback(<AppShell />)}>
        <Route index element={withFallback(<DashboardPage />)} />
        <Route path="/openings" element={withFallback(<OpeningsPage />)} />
        <Route path="/habits" element={withFallback(<HabitsPage />)} />
        <Route path="/games" element={withFallback(<GamesPage />)} />
        <Route path="/settings" element={withFallback(<SettingsPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function RouteFallback() {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200/10 bg-[#101813] p-4">
      <Skeleton className="h-8 w-1/3 bg-stone-100/10" />
      <Skeleton className="h-24 w-full bg-stone-100/10" />
      <Skeleton className="h-24 w-full bg-stone-100/10" />
    </div>
  );
}
