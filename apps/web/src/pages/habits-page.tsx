import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HeatmapCellDto } from '@ecoconception/shared';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatPercent } from '@/lib/format';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeClassOptions = ['', 'bullet', 'blitz', 'rapid', 'daily'];

const cellClassName = (games: number, winrate: number) => {
  if (games === 0) {
    return 'bg-slate-100 text-slate-400';
  }
  if (winrate >= 0.65) {
    return 'bg-emerald-500 text-white';
  }
  if (winrate >= 0.5) {
    return 'bg-emerald-300 text-slate-900';
  }
  if (winrate >= 0.35) {
    return 'bg-amber-300 text-slate-900';
  }
  return 'bg-rose-400 text-white';
};

export function HabitsPage() {
  const { username } = useSettings();
  const [timeClass, setTimeClass] = useState('');

  const filters = {
    username: username || undefined,
    timeClass: timeClass || undefined
  };

  const heatmapQuery = useQuery({
    queryKey: ['heatmap', filters],
    queryFn: () => api.heatmap(filters)
  });

  const streaksQuery = useQuery({
    queryKey: ['streaks', filters],
    queryFn: () => api.streaks(filters)
  });

  const heatmapByDay = useMemo(() => {
    const rows = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => null as null | HeatmapCellDto)
    );
    for (const cell of heatmapQuery.data?.cells || []) {
      rows[cell.weekday][cell.hour] = cell;
    }
    return rows;
  }, [heatmapQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">Heatmap hebdomadaire + streaks + tilt index.</p>
        </div>
        <div className="w-52">
          <Select value={timeClass} onChange={(event) => setTimeClass(event.target.value)}>
            {timeClassOptions.map((option) => (
              <option key={option || 'all'} value={option}>
                {option || 'all'}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time heatmap</CardTitle>
          <CardDescription>Performance par jour/heure (UTC).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          {heatmapQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading heatmap...</p>
          ) : heatmapQuery.isError ? (
            <p className="text-sm text-red-600">{heatmapQuery.error.message}</p>
          ) : (
            <div className="min-w-[880px] space-y-2">
              <div className="grid grid-cols-[80px_repeat(24,minmax(28px,1fr))] gap-1 text-[10px] text-muted-foreground">
                <div />
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="text-center">
                    {hour}
                  </div>
                ))}
              </div>
              {heatmapByDay.map((row, weekday) => (
                <div key={weekday} className="grid grid-cols-[80px_repeat(24,minmax(28px,1fr))] gap-1">
                  <div className="flex items-center text-xs font-medium text-muted-foreground">{weekdays[weekday]}</div>
                  {row.map((cell, hour) => (
                    <div
                      key={`${weekday}-${hour}`}
                      title={
                        cell
                          ? `${weekdays[weekday]} ${hour}:00 • ${cell.games} games • ${formatPercent(cell.winrate)}`
                          : `${weekdays[weekday]} ${hour}:00`
                      }
                      className={`h-8 rounded text-center text-[10px] leading-8 ${cellClassName(cell?.games || 0, cell?.winrate || 0)}`}
                    >
                      {cell?.games || 0}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streaks & tilt</CardTitle>
        </CardHeader>
        <CardContent>
          {streaksQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading streaks...</p>
          ) : streaksQuery.isError ? (
            <p className="text-sm text-red-600">{streaksQuery.error.message}</p>
          ) : streaksQuery.data ? (
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Longest win streak" value={String(streaksQuery.data.longestWinStreak)} />
              <MetricCard label="Longest loss streak" value={String(streaksQuery.data.longestLossStreak)} />
              <MetricCard label="Current streak" value={`${streaksQuery.data.currentStreak.type} (${streaksQuery.data.currentStreak.length})`} />

              <MetricCard
                label="After 1 loss"
                value={`${formatPercent(streaksQuery.data.tiltIndex.after1Loss.winrate)} • n=${streaksQuery.data.tiltIndex.after1Loss.sampleSize}`}
              />
              <MetricCard
                label="After 2 losses"
                value={`${formatPercent(streaksQuery.data.tiltIndex.after2Losses.winrate)} • n=${streaksQuery.data.tiltIndex.after2Losses.sampleSize}`}
              />
              <MetricCard
                label="After 3 losses"
                value={`${formatPercent(streaksQuery.data.tiltIndex.after3Losses.winrate)} • n=${streaksQuery.data.tiltIndex.after3Losses.sampleSize}`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
