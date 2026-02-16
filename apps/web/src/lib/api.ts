import type {
  GameDetailDto,
  GameListDto,
  HeatmapDto,
  OpeningsDto,
  RatingSeriesDto,
  StreaksDto,
  SummaryDto,
  SyncStatusDto
} from '@ecoconception/shared';

const baseUrl = (import.meta.env.VITE_API_URL || '').trim();

const buildUrl = (path: string, query?: Record<string, string | number | undefined>) => {
  const url = new URL(path, baseUrl || window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return baseUrl ? url.toString() : `${url.pathname}${url.search}`;
};

const request = async <T>(path: string, init?: RequestInit, query?: Record<string, string | number | undefined>) => {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

export type CommonStatsFilters = {
  username?: string;
  timeClass?: string;
  from?: number;
  to?: number;
};

export const api = {
  hello: () => request('/api/hello'),
  sync: (payload: { username?: string; full?: boolean }) =>
    request('/api/sync', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  syncStatus: (username?: string) => request<SyncStatusDto>('/api/sync/status', undefined, { username }),
  summary: (filters: CommonStatsFilters) => request<SummaryDto>('/api/stats/summary', undefined, filters),
  ratingSeries: (filters: CommonStatsFilters) =>
    request<RatingSeriesDto>('/api/stats/rating-series', undefined, filters),
  openings: (filters: CommonStatsFilters & { minGames?: number }) =>
    request<OpeningsDto>('/api/stats/openings', undefined, filters),
  streaks: (filters: CommonStatsFilters) => request<StreaksDto>('/api/stats/streaks', undefined, filters),
  heatmap: (filters: CommonStatsFilters) => request<HeatmapDto>('/api/stats/time-heatmap', undefined, filters),
  games: (
    filters: CommonStatsFilters & {
      page?: number;
      pageSize?: number;
      result?: string;
      color?: string;
      eco?: string;
      search?: string;
    }
  ) => request<GameListDto>('/api/games', undefined, filters),
  gameDetail: (id: number, username?: string) =>
    request<GameDetailDto>(`/api/games/${id}`, undefined, { username })
};
