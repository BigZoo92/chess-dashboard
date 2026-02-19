import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { LazyCharts } from '@/components/lazy-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

const timeClassOptions = ['', 'bullet', 'blitz', 'rapid', 'daily'];

export function DashboardPage() {
  const { username } = useSettings();
  const [timeClass, setTimeClass] = useState('');
  const queryClient = useQueryClient();

  const filters = {
    username: username || undefined,
    timeClass: timeClass || undefined
  };

  const summaryQuery = useQuery({
    queryKey: ['summary', filters],
    queryFn: () => api.summary(filters)
  });

  const ratingQuery = useQuery({
    queryKey: ['rating-series', filters],
    queryFn: () => api.ratingSeries(filters)
  });

  const syncMutation = useMutation({
    mutationFn: () => api.sync({ username: username || undefined }),
    onSuccess: () => {
      toast.success('Sync completed');
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const summary = summaryQuery.data;
  const ratingPoints = ratingQuery.data?.points || [];

  return (
    <div className="space-y-6 rounded-2xl border border-stone-200/10 bg-[#111914]/70 p-4 text-stone-100 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-100">Overview</h1>
          <p className="text-sm text-stone-300">KPI globaux, progression Elo et performances par cadence.</p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-emerald-400 text-[#102117] hover:bg-emerald-300"
        >
          {syncMutation.isPending ? 'Syncing...' : 'Sync now'}
        </Button>
      </div>
      <h2 className="sr-only">Overview sections</h2>

      <TabsList className="border border-stone-200/10 bg-[#0d130f]">
        {timeClassOptions.map((option) => (
          <TabsTrigger
            key={option || 'all'}
            active={timeClass === option}
            onClick={() => setTimeClass(option)}
            className={cn(
              'capitalize',
              timeClass === option
                ? '!bg-emerald-400/20 !text-emerald-100'
                : '!text-stone-300 hover:!text-stone-100'
            )}
          >
            {option || 'all'}
          </TabsTrigger>
        ))}
      </TabsList>

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 bg-stone-100/10" />
          ))}
        </div>
      ) : summaryQuery.isError ? (
        <Card className="border-stone-200/10 bg-[#141c17] text-stone-100">
          <CardContent className="p-6 text-sm text-rose-300">{summaryQuery.error.message}</CardContent>
        </Card>
      ) : summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <KpiCard title="Total games" value={summary.totals.games.toString()} />
            <KpiCard title="Winrate" value={formatPercent(summary.totals.winrate)} />
            <KpiCard title="W/L/D" value={`${summary.totals.wins}/${summary.totals.losses}/${summary.totals.draws}`} />
            <KpiCard
              title="Avg accuracy"
              value={summary.totals.avgAccuracy !== null ? `${summary.totals.avgAccuracy.toFixed(1)}%` : '-'}
            />
            <KpiCard title="Last 30d delta" value={`${summary.delta30d.gamesDelta >= 0 ? '+' : ''}${summary.delta30d.gamesDelta}`} />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-stone-100">Charts</h2>

          <LazyCharts ratingPoints={ratingPoints} byTimeClass={summary.byTimeClass} />
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-stone-200/10 bg-[#141c17] text-stone-100">
      <CardHeader className="pb-2">
        <CardDescription className="text-stone-300">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-stone-100">{value}</p>
      </CardContent>
    </Card>
  );
}
