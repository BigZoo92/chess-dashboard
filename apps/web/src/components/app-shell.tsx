import { Link, NavLink, Outlet } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Flame, Home, RefreshCw, Settings2, Swords } from 'lucide-react';
import { toast } from 'sonner';

import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const links = [
  {
    to: '/',
    label: 'Dashboard',
    icon: Home
  },
  {
    to: '/openings',
    label: 'Openings',
    icon: BarChart3
  },
  {
    to: '/habits',
    label: 'Habits',
    icon: Flame
  },
  {
    to: '/games',
    label: 'Games',
    icon: Swords
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings2
  }
];

export function AppShell() {
  const { username } = useSettings();
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ['sync-status', username],
    queryFn: () => api.syncStatus(username || undefined),
    refetchInterval: 5000
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      api.sync({
        username: username || undefined
      }),
    onSuccess: () => {
      toast.success('Sync completed');
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 border-r bg-white p-4 md:block">
        <Link to="/" className="mb-8 block text-lg font-semibold">
          Chess.com Stats
        </Link>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="text-base font-semibold md:hidden">
                Chess.com Stats
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Badge variant="secondary">{statusQuery.data?.username || username || 'No username'}</Badge>
                <span className="text-xs text-muted-foreground">
                  Last sync:{' '}
                  {formatDateTime(statusQuery.data?.lastSyncAt ? Date.parse(statusQuery.data.lastSyncAt) / 1000 : null)}
                </span>
              </div>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || statusQuery.data?.isSyncing}
                className="gap-2"
              >
                <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
                {syncMutation.isPending || statusQuery.data?.isSyncing ? 'Syncing...' : 'Sync now'}
              </Button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Badge variant="secondary">{statusQuery.data?.username || username || 'No username'}</Badge>
              <span className="text-xs text-muted-foreground">
                Last sync:{' '}
                {formatDateTime(statusQuery.data?.lastSyncAt ? Date.parse(statusQuery.data.lastSyncAt) / 1000 : null)}
              </span>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
