import { Link, NavLink, Outlet } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Flame, Home, RefreshCw, Settings2, Swords } from 'lucide-react';
import { toast } from 'sonner';

import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="flex min-h-screen bg-[#0e1511] text-stone-100">
      <aside className="hidden w-64 border-r border-stone-200/10 bg-[#101813] p-4 md:block">
        <Link to="/" className="mb-8 block text-lg font-semibold text-stone-100">
          Chess.com Stats
        </Link>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                  isActive
                    ? 'bg-emerald-400/15 text-emerald-100'
                    : 'text-stone-300 hover:bg-stone-100/10 hover:text-stone-100'
                )
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-stone-200/10 bg-[#101813]/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="text-base font-semibold text-stone-100 md:hidden">
                Chess.com Stats
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Badge variant="outline" className="border-stone-200/20 bg-stone-100/5 text-stone-200">
                  {statusQuery.data?.username || username || 'No username'}
                </Badge>
                <span className="text-xs text-stone-400">
                  Last sync:{' '}
                  {formatDateTime(statusQuery.data?.lastSyncAt ? Date.parse(statusQuery.data.lastSyncAt) / 1000 : null)}
                </span>
              </div>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || statusQuery.data?.isSyncing}
                className="gap-2 bg-emerald-400 text-[#102117] hover:bg-emerald-300"
              >
                <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
                {syncMutation.isPending || statusQuery.data?.isSyncing ? 'Syncing...' : 'Sync now'}
              </Button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Badge variant="outline" className="border-stone-200/20 bg-stone-100/5 text-stone-200">
                {statusQuery.data?.username || username || 'No username'}
              </Badge>
              <span className="text-xs text-stone-400">
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
                    cn(
                      'whitespace-nowrap rounded-md px-3 py-1.5 text-xs',
                      isActive ? 'bg-emerald-400/15 text-emerald-100' : 'bg-stone-100/10 text-stone-300'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 text-stone-100 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
