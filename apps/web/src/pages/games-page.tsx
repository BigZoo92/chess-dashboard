import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';
import { formatShortDate } from '@/lib/format';

const timeClassOptions = ['', 'bullet', 'blitz', 'rapid', 'daily'];
const resultOptions = ['', 'win', 'loss', 'draw'];
const colorOptions = ['', 'white', 'black'];

export function GamesPage() {
  const { username } = useSettings();
  const [page, setPage] = useState(1);
  const [timeClass, setTimeClass] = useState('');
  const [result, setResult] = useState('');
  const [color, setColor] = useState('');
  const [eco, setEco] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const filters = useMemo(
    () => ({
      username: username || undefined,
      page,
      pageSize: 20,
      timeClass: timeClass || undefined,
      result: result || undefined,
      color: color || undefined,
      eco: eco || undefined,
      search: search || undefined
    }),
    [color, eco, page, result, search, timeClass, username]
  );

  const gamesQuery = useQuery({
    queryKey: ['games', filters],
    queryFn: () => api.games(filters)
  });

  const detailQuery = useQuery({
    queryKey: ['game-detail', selectedGameId, username],
    enabled: selectedGameId !== null,
    queryFn: () => api.gameDetail(selectedGameId as number, username || undefined)
  });

  const totalPages = gamesQuery.data ? Math.max(1, Math.ceil(gamesQuery.data.total / gamesQuery.data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-sm text-muted-foreground">Table paginée avec filtres et détail PGN.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <FilterSelect
            label="Time class"
            value={timeClass}
            onChange={(value) => {
              setPage(1);
              setTimeClass(value);
            }}
            options={timeClassOptions}
          />
          <FilterSelect
            label="Result"
            value={result}
            onChange={(value) => {
              setPage(1);
              setResult(value);
            }}
            options={resultOptions}
          />
          <FilterSelect
            label="Color"
            value={color}
            onChange={(value) => {
              setPage(1);
              setColor(value);
            }}
            options={colorOptions}
          />
          <div className="space-y-2">
            <Label htmlFor="games-eco">ECO contains</Label>
            <Input
              id="games-eco"
              value={eco}
              onChange={(event) => {
                setPage(1);
                setEco(event.target.value);
              }}
              placeholder="Sicilian"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="games-search">Opponent</Label>
            <Input
              id="games-search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="username"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {gamesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading games...</p>
          ) : gamesQuery.isError ? (
            <p className="text-sm text-rose-300">{gamesQuery.error.message}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Time class</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Opening</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gamesQuery.data?.items.map((game) => (
                    <TableRow key={game.id} className="cursor-pointer" onClick={() => setSelectedGameId(game.id)}>
                      <TableCell>{formatShortDate(game.endTime)}</TableCell>
                      <TableCell>{game.opponentUsername}</TableCell>
                      <TableCell>{game.timeClass}</TableCell>
                      <TableCell className="uppercase">{game.result}</TableCell>
                      <TableCell>{game.color}</TableCell>
                      <TableCell>{game.playerRating ?? '-'}</TableCell>
                      <TableCell>{game.eco || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  {gamesQuery.data?.total || 0} games • page {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedGameId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-stone-200/10 bg-[#111914] p-6 shadow-xl shadow-black/40">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-semibold">Game detail</h2>
              <button
                onClick={() => {
                  setSelectedGameId(null);
                }}
                className="rounded p-1 hover:bg-stone-100/10"
              >
                <X size={18} />
              </button>
            </div>
            {detailQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading detail...</p>
            ) : detailQuery.isError ? (
              <p className="text-sm text-rose-300">{detailQuery.error.message}</p>
            ) : detailQuery.data ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <Metric label="Date" value={formatShortDate(detailQuery.data.game.endTime)} />
                  <Metric label="Opening" value={detailQuery.data.game.eco || '-'} />
                  <Metric label="Result" value={detailQuery.data.game.result.toUpperCase()} />
                  <Metric label="Color" value={detailQuery.data.game.color} />
                  <Metric label="White" value={`${detailQuery.data.game.whiteUsername} (${detailQuery.data.game.whiteResult || '-'})`} />
                  <Metric label="Black" value={`${detailQuery.data.game.blackUsername} (${detailQuery.data.game.blackResult || '-'})`} />
                </div>
                <a href={detailQuery.data.game.url} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  Open on Chess.com
                </a>
                <details>
                  <summary className="cursor-pointer font-medium">PGN</summary>
                  <Textarea value={detailQuery.data.game.pgn || ''} readOnly className="mt-2 min-h-52 font-mono text-xs" />
                </details>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || 'all'} value={option}>
            {option || 'all'}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200/10 bg-[#141c17] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
