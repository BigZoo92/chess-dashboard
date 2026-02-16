export type HelloResponse = {
  message: string;
  db: {
    ok: true;
    playersCount: number;
  };
};

export type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily' | 'unknown';
export type ResultPerspective = 'win' | 'loss' | 'draw';
export type ColorPerspective = 'white' | 'black';

export type SyncStatusDto = {
  username: string | null;
  lastSyncAt: string | null;
  totals: {
    games: number;
  };
  isSyncing: boolean;
};

export type SummaryBucket = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
};

export type SummaryDto = {
  username: string;
  filters: {
    timeClass?: string;
    from?: number;
    to?: number;
  };
  totals: SummaryBucket & {
    avgAccuracy: number | null;
  };
  byColor: {
    white: SummaryBucket;
    black: SummaryBucket;
  };
  byTimeClass: Array<
    SummaryBucket & {
      timeClass: string;
    }
  >;
  delta30d: {
    currentGames: number;
    previousGames: number;
    gamesDelta: number;
    currentWinrate: number;
    previousWinrate: number;
    winrateDelta: number;
  };
  lastSyncAt: string | null;
};

export type RatingSeriesPoint = {
  id: number;
  endTime: number;
  rating: number;
  color: ColorPerspective;
  result: ResultPerspective;
};

export type RatingSeriesDto = {
  username: string;
  points: RatingSeriesPoint[];
};

export type OpeningStatDto = {
  eco: string;
  ecoUrl: string | null;
  color: ColorPerspective;
  games: number;
  winrate: number;
  avgAccuracy: number | null;
  lastPlayed: number | null;
};

export type OpeningsDto = {
  username: string;
  minGames: number;
  openings: OpeningStatDto[];
  bestOpenings: OpeningStatDto[];
  worstOpenings: OpeningStatDto[];
};

export type TiltSliceDto = {
  sampleSize: number;
  avgPoints: number;
  winrate: number;
};

export type StreaksDto = {
  username: string;
  totalGames: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: {
    type: ResultPerspective | 'none';
    length: number;
  };
  tiltIndex: {
    after1Loss: TiltSliceDto;
    after2Losses: TiltSliceDto;
    after3Losses: TiltSliceDto;
  };
};

export type HeatmapCellDto = {
  weekday: number;
  hour: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
};

export type HeatmapDto = {
  username: string;
  cells: HeatmapCellDto[];
};

export type GameListItemDto = {
  id: number;
  url: string;
  endTime: number;
  timeClass: string;
  timeControl: string | null;
  rules: string | null;
  rated: boolean;
  eco: string | null;
  ecoUrl: string | null;
  result: ResultPerspective;
  color: ColorPerspective;
  opponentUsername: string;
  playerRating: number | null;
  opponentRating: number | null;
  whiteResult: string | null;
  blackResult: string | null;
  whiteAccuracy: number | null;
  blackAccuracy: number | null;
};

export type GameListDto = {
  username: string;
  page: number;
  pageSize: number;
  total: number;
  items: GameListItemDto[];
};

export type GameDetailDto = {
  username: string;
  game: GameListItemDto & {
    pgn: string | null;
    tcn: string | null;
    fen: string | null;
    whiteUsername: string;
    blackUsername: string;
  };
};
