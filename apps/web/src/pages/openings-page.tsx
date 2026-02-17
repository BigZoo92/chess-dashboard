import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OpeningStatDto } from '@ecoconception/shared';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatPercent, formatShortDate } from '@/lib/format';

const timeClassOptions = ['', 'bullet', 'blitz', 'rapid', 'daily'];

export function OpeningsPage() {
  const { username } = useSettings();
  const [timeClass, setTimeClass] = useState('');
  const [minGames, setMinGames] = useState(10);
  const [activeTab, setActiveTab] = useState<'best' | 'worst'>('best');
  const [selectedOpening, setSelectedOpening] = useState<OpeningStatDto | null>(null);

  const filters = {
    username: username || undefined,
    timeClass: timeClass || undefined,
    minGames
  };

  const openingsQuery = useQuery({
    queryKey: ['openings', filters],
    queryFn: () => api.openings(filters)
  });

  const openingGamesQuery = useQuery({
    queryKey: ['opening-games', filters, selectedOpening?.eco],
    enabled: Boolean(selectedOpening),
    queryFn: () =>
      api.games({
        username: username || undefined,
        timeClass: timeClass || undefined,
        eco: selectedOpening?.eco,
        page: 1,
        pageSize: 8
      })
  });

  const rows = useMemo(() => {
    if (!openingsQuery.data) {
      return [];
    }
    return activeTab === 'best' ? openingsQuery.data.bestOpenings : openingsQuery.data.worstOpenings;
  }, [activeTab, openingsQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Openings</h1>
        <p className="text-sm text-muted-foreground">Top et low performers par ouverture (point de vue joueur).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="openings-time-class">Time class</Label>
            <Select id="openings-time-class" value={timeClass} onChange={(event) => setTimeClass(event.target.value)}>
              {timeClassOptions.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option || 'all'}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openings-min-games">Min games</Label>
            <Input
              id="openings-min-games"
              type="number"
              min={1}
              value={minGames}
              onChange={(event) => setMinGames(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
        </CardContent>
      </Card>

      <TabsList>
        <TabsTrigger active={activeTab === 'best'} onClick={() => setActiveTab('best')}>
          Best openings
        </TabsTrigger>
        <TabsTrigger active={activeTab === 'worst'} onClick={() => setActiveTab('worst')}>
          Worst openings
        </TabsTrigger>
      </TabsList>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'best' ? 'Best openings' : 'Worst openings'}</CardTitle>
          <CardDescription>Cliquer une ligne pour les détails.</CardDescription>
        </CardHeader>
        <CardContent>
          {openingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading openings...</p>
          ) : openingsQuery.isError ? (
            <p className="text-sm text-rose-300">{openingsQuery.error.message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opening</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Games</TableHead>
                  <TableHead>Winrate</TableHead>
                  <TableHead>Avg accuracy</TableHead>
                  <TableHead>Last played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((opening) => (
                  <TableRow key={`${opening.eco}-${opening.color}`} className="cursor-pointer" onClick={() => setSelectedOpening(opening)}>
                    <TableCell>{opening.eco}</TableCell>
                    <TableCell className="capitalize">{opening.color}</TableCell>
                    <TableCell>{opening.games}</TableCell>
                    <TableCell>{formatPercent(opening.winrate)}</TableCell>
                    <TableCell>{opening.avgAccuracy !== null ? `${opening.avgAccuracy.toFixed(1)}%` : '-'}</TableCell>
                    <TableCell>{opening.lastPlayed ? formatShortDate(opening.lastPlayed) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedOpening && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedOpening(null)} />
          <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-stone-200/10 bg-[#111914] p-6 shadow-xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedOpening.eco}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedOpening.color} • {selectedOpening.games} games
                </p>
              </div>
              <button onClick={() => setSelectedOpening(null)} className="rounded p-1 hover:bg-stone-100/10">
                <span className="text-lg leading-none" aria-hidden>
                  x
                </span>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Winrate" value={formatPercent(selectedOpening.winrate)} />
              <MetricCard
                label="Avg accuracy"
                value={selectedOpening.avgAccuracy !== null ? `${selectedOpening.avgAccuracy.toFixed(1)}%` : '-'}
              />
              <MetricCard label="Games" value={String(selectedOpening.games)} />
              <MetricCard label="Last played" value={selectedOpening.lastPlayed ? formatShortDate(selectedOpening.lastPlayed) : '-'} />
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Last games</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {openingGamesQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading games...</p>
                ) : openingGamesQuery.isError ? (
                  <p className="text-rose-300">{openingGamesQuery.error.message}</p>
                ) : (
                  openingGamesQuery.data?.items.map((game) => (
                    <div key={game.id} className="rounded border border-stone-200/10 bg-stone-100/5 p-2">
                      <p className="font-medium">
                        vs {game.opponentUsername} • {game.timeClass}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(game.endTime)} • {game.result.toUpperCase()} • rating {game.playerRating ?? '-'}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200/10 bg-[#141c17] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
