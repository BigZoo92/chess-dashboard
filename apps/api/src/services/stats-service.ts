import type {
  ColorPerspective,
  GameDetailDto,
  GameListDto,
  GameListItemDto,
  HeatmapDto,
  OpeningStatDto,
  OpeningsDto,
  RatingSeriesDto,
  ResultPerspective,
  StreaksDto,
  SummaryBucket,
  SummaryDto,
  TiltSliceDto
} from '@ecoconception/shared';
import { Prisma } from '@prisma/client';

import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { prisma } from '../prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildBucket = (): SummaryBucket => ({
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winrate: 0
});

const updateBucket = (bucket: SummaryBucket, result: ResultPerspective) => {
  bucket.games += 1;
  if (result === 'win') {
    bucket.wins += 1;
  } else if (result === 'loss') {
    bucket.losses += 1;
  } else {
    bucket.draws += 1;
  }
  bucket.winrate = bucket.games > 0 ? Number((bucket.wins / bucket.games).toFixed(4)) : 0;
};

const toUnix = (value: Date) => Math.floor(value.getTime() / 1000);

const timestampToDate = (timestamp: number) => {
  const ms = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(ms);
};

const getUsernameOrThrow = (username?: string) => {
  const resolved = username?.trim() || config.chessCom.defaultUsername;
  if (!resolved) {
    throw new HttpError(400, 'username is required. Provide it as query param or CHESSCOM_USERNAME env.');
  }
  return resolved;
};

type CommonFilters = {
  username?: string;
  timeClass?: string;
  from?: number;
  to?: number;
};

type GamesFilters = CommonFilters & {
  result?: ResultPerspective;
  color?: ColorPerspective;
  eco?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

const buildBaseWhere = (
  playerId: number,
  filters: CommonFilters,
  includeDate = true
): Prisma.GameWhereInput => {
  const where: Prisma.GameWhereInput = {
    playerId
  };

  if (filters.timeClass) {
    where.timeClass = filters.timeClass;
  }

  if (includeDate && (filters.from || filters.to)) {
    where.endTime = {};
    if (filters.from) {
      where.endTime.gte = timestampToDate(filters.from);
    }
    if (filters.to) {
      where.endTime.lte = timestampToDate(filters.to);
    }
  }

  return where;
};

const resolvePlayer = async (username?: string) => {
  const resolvedUsername = getUsernameOrThrow(username);
  const player = await prisma.player.findUnique({
    where: {
      username: resolvedUsername
    },
    select: {
      id: true,
      username: true,
      lastSyncAt: true
    }
  });

  if (!player) {
    throw new HttpError(404, `Player "${resolvedUsername}" is not synced yet. Trigger /api/sync first.`);
  }

  return player;
};

const getPerspectiveAccuracy = (game: {
  colorPerspective: string;
  whiteAccuracy: number | null;
  blackAccuracy: number | null;
}) => {
  if (game.colorPerspective === 'white') {
    return game.whiteAccuracy;
  }
  return game.blackAccuracy;
};

const computeTiltSlice = (results: ResultPerspective[], streakSize: number): TiltSliceDto => {
  let sampleSize = 0;
  let totalPoints = 0;
  let wins = 0;

  for (let index = streakSize; index < results.length; index += 1) {
    let hadLossStreak = true;
    for (let offset = 1; offset <= streakSize; offset += 1) {
      if (results[index - offset] !== 'loss') {
        hadLossStreak = false;
        break;
      }
    }

    if (!hadLossStreak) {
      continue;
    }

    sampleSize += 1;
    const result = results[index];
    if (result === 'win') {
      wins += 1;
      totalPoints += 1;
    } else if (result === 'draw') {
      totalPoints += 0.5;
    }
  }

  return {
    sampleSize,
    avgPoints: sampleSize > 0 ? Number((totalPoints / sampleSize).toFixed(4)) : 0,
    winrate: sampleSize > 0 ? Number((wins / sampleSize).toFixed(4)) : 0
  };
};

export const getSummaryStats = async (filters: CommonFilters): Promise<SummaryDto> => {
  const player = await resolvePlayer(filters.username);
  const where = buildBaseWhere(player.id, filters);

  const games = await prisma.game.findMany({
    where,
    orderBy: {
      endTime: 'asc'
    },
    select: {
      endTime: true,
      timeClass: true,
      colorPerspective: true,
      resultPerspective: true,
      whiteAccuracy: true,
      blackAccuracy: true
    }
  });

  const totals = buildBucket();
  const byColor = {
    white: buildBucket(),
    black: buildBucket()
  };
  const byTimeClassMap = new Map<string, SummaryBucket>();

  let accuracySum = 0;
  let accuracyCount = 0;

  for (const game of games) {
    const result = game.resultPerspective as ResultPerspective;
    const color = game.colorPerspective as ColorPerspective;
    updateBucket(totals, result);
    updateBucket(byColor[color], result);

    const byTimeClassBucket = byTimeClassMap.get(game.timeClass) || buildBucket();
    updateBucket(byTimeClassBucket, result);
    byTimeClassMap.set(game.timeClass, byTimeClassBucket);

    const accuracy = getPerspectiveAccuracy(game);
    if (accuracy !== null && Number.isFinite(accuracy)) {
      accuracySum += accuracy;
      accuracyCount += 1;
    }
  }

  const now = new Date();
  const currentFrom = new Date(now.getTime() - 30 * DAY_MS);
  const previousFrom = new Date(now.getTime() - 60 * DAY_MS);

  const deltaWhereBase = buildBaseWhere(player.id, { timeClass: filters.timeClass }, false);

  const [currentWindow, previousWindow] = await Promise.all([
    prisma.game.findMany({
      where: {
        ...deltaWhereBase,
        endTime: {
          gte: currentFrom,
          lte: now
        }
      },
      select: {
        resultPerspective: true
      }
    }),
    prisma.game.findMany({
      where: {
        ...deltaWhereBase,
        endTime: {
          gte: previousFrom,
          lt: currentFrom
        }
      },
      select: {
        resultPerspective: true
      }
    })
  ]);

  const currentWins = currentWindow.filter((game) => game.resultPerspective === 'win').length;
  const previousWins = previousWindow.filter((game) => game.resultPerspective === 'win').length;

  const currentWinrate = currentWindow.length > 0 ? currentWins / currentWindow.length : 0;
  const previousWinrate = previousWindow.length > 0 ? previousWins / previousWindow.length : 0;

  return {
    username: player.username,
    filters,
    totals: {
      ...totals,
      avgAccuracy: accuracyCount > 0 ? Number((accuracySum / accuracyCount).toFixed(2)) : null
    },
    byColor,
    byTimeClass: Array.from(byTimeClassMap.entries())
      .map(([timeClass, bucket]) => ({
        timeClass,
        ...bucket
      }))
      .sort((a, b) => b.games - a.games),
    delta30d: {
      currentGames: currentWindow.length,
      previousGames: previousWindow.length,
      gamesDelta: currentWindow.length - previousWindow.length,
      currentWinrate: Number(currentWinrate.toFixed(4)),
      previousWinrate: Number(previousWinrate.toFixed(4)),
      winrateDelta: Number((currentWinrate - previousWinrate).toFixed(4))
    },
    lastSyncAt: player.lastSyncAt?.toISOString() || null
  };
};

export const getRatingSeries = async (filters: CommonFilters): Promise<RatingSeriesDto> => {
  const player = await resolvePlayer(filters.username);
  const where = buildBaseWhere(player.id, filters);

  const games = await prisma.game.findMany({
    where,
    orderBy: {
      endTime: 'asc'
    },
    select: {
      id: true,
      endTime: true,
      colorPerspective: true,
      resultPerspective: true,
      whiteRating: true,
      blackRating: true
    }
  });

  return {
    username: player.username,
    points: games
      .map((game) => ({
        id: game.id,
        endTime: toUnix(game.endTime),
        rating:
          game.colorPerspective === 'white'
            ? (game.whiteRating ?? game.blackRating ?? 0)
            : (game.blackRating ?? game.whiteRating ?? 0),
        color: game.colorPerspective as ColorPerspective,
        result: game.resultPerspective as ResultPerspective
      }))
      .filter((point) => point.rating > 0)
  };
};

export const getOpeningsStats = async (
  filters: CommonFilters & { minGames?: number }
): Promise<OpeningsDto> => {
  const player = await resolvePlayer(filters.username);
  const where = buildBaseWhere(player.id, filters);
  const minGames = Math.max(1, filters.minGames || 10);

  const games = await prisma.game.findMany({
    where,
    orderBy: {
      endTime: 'desc'
    },
    select: {
      eco: true,
      ecoUrl: true,
      colorPerspective: true,
      resultPerspective: true,
      endTime: true,
      whiteAccuracy: true,
      blackAccuracy: true
    }
  });

  const grouped = new Map<
    string,
    {
      eco: string;
      ecoUrl: string | null;
      color: ColorPerspective;
      games: number;
      wins: number;
      accuracySum: number;
      accuracyCount: number;
      lastPlayed: number | null;
    }
  >();

  for (const game of games) {
    const eco = game.eco || 'Unknown Opening';
    const color = game.colorPerspective as ColorPerspective;
    const key = `${eco}::${game.ecoUrl || ''}::${color}`;
    const record = grouped.get(key) || {
      eco,
      ecoUrl: game.ecoUrl || null,
      color,
      games: 0,
      wins: 0,
      accuracySum: 0,
      accuracyCount: 0,
      lastPlayed: null
    };

    record.games += 1;
    if (game.resultPerspective === 'win') {
      record.wins += 1;
    }

    const accuracy = getPerspectiveAccuracy(game);
    if (accuracy !== null && Number.isFinite(accuracy)) {
      record.accuracySum += accuracy;
      record.accuracyCount += 1;
    }

    const endTime = toUnix(game.endTime);
    if (record.lastPlayed === null || endTime > record.lastPlayed) {
      record.lastPlayed = endTime;
    }

    grouped.set(key, record);
  }

  const openings: OpeningStatDto[] = Array.from(grouped.values())
    .filter((entry) => entry.games >= minGames)
    .map((entry) => ({
      eco: entry.eco,
      ecoUrl: entry.ecoUrl,
      color: entry.color,
      games: entry.games,
      winrate: Number((entry.wins / entry.games).toFixed(4)),
      avgAccuracy:
        entry.accuracyCount > 0 ? Number((entry.accuracySum / entry.accuracyCount).toFixed(2)) : null,
      lastPlayed: entry.lastPlayed
    }))
    .sort((a, b) => b.games - a.games);

  const rankedByWinrate = [...openings].sort((a, b) => b.winrate - a.winrate);

  return {
    username: player.username,
    minGames,
    openings,
    bestOpenings: rankedByWinrate.slice(0, 12),
    worstOpenings: [...rankedByWinrate].reverse().slice(0, 12)
  };
};

export const getStreaksStats = async (filters: CommonFilters): Promise<StreaksDto> => {
  const player = await resolvePlayer(filters.username);
  const where = buildBaseWhere(player.id, filters);

  const games = await prisma.game.findMany({
    where,
    orderBy: {
      endTime: 'asc'
    },
    select: {
      resultPerspective: true
    }
  });

  const results = games.map((game) => game.resultPerspective as ResultPerspective);

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const result of results) {
    if (result === 'win') {
      currentWinStreak += 1;
      currentLossStreak = 0;
    } else if (result === 'loss') {
      currentLossStreak += 1;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
  }

  let currentStreakType: ResultPerspective | 'none' = 'none';
  let currentStreakLength = 0;
  for (let index = results.length - 1; index >= 0; index -= 1) {
    const result = results[index];
    if (result === 'draw') {
      if (currentStreakLength === 0) {
        currentStreakType = 'draw';
        currentStreakLength = 1;
      } else if (currentStreakType === 'draw') {
        currentStreakLength += 1;
      }
      if (currentStreakType !== 'draw') {
        break;
      }
      continue;
    }

    if (currentStreakLength === 0) {
      currentStreakType = result;
      currentStreakLength = 1;
      continue;
    }

    if (currentStreakType === result) {
      currentStreakLength += 1;
      continue;
    }
    break;
  }

  return {
    username: player.username,
    totalGames: results.length,
    longestWinStreak,
    longestLossStreak,
    currentStreak: {
      type: currentStreakType,
      length: currentStreakLength
    },
    tiltIndex: {
      after1Loss: computeTiltSlice(results, 1),
      after2Losses: computeTiltSlice(results, 2),
      after3Losses: computeTiltSlice(results, 3)
    }
  };
};

export const getTimeHeatmap = async (filters: CommonFilters): Promise<HeatmapDto> => {
  const player = await resolvePlayer(filters.username);
  const where = buildBaseWhere(player.id, filters);

  const games = await prisma.game.findMany({
    where,
    select: {
      endTime: true,
      resultPerspective: true
    }
  });

  const buckets = new Map<
    string,
    {
      weekday: number;
      hour: number;
      games: number;
      wins: number;
      losses: number;
      draws: number;
    }
  >();

  for (const game of games) {
    const weekday = game.endTime.getUTCDay();
    const hour = game.endTime.getUTCHours();
    const key = `${weekday}-${hour}`;
    const bucket = buckets.get(key) || {
      weekday,
      hour,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

    bucket.games += 1;
    if (game.resultPerspective === 'win') {
      bucket.wins += 1;
    } else if (game.resultPerspective === 'loss') {
      bucket.losses += 1;
    } else {
      bucket.draws += 1;
    }

    buckets.set(key, bucket);
  }

  const cells = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const key = `${weekday}-${hour}`;
      const bucket = buckets.get(key) || {
        weekday,
        hour,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0
      };
      cells.push({
        ...bucket,
        winrate: bucket.games > 0 ? Number((bucket.wins / bucket.games).toFixed(4)) : 0
      });
    }
  }

  return {
    username: player.username,
    cells
  };
};

const mapGameToListItem = (
  game: {
    id: number;
    url: string;
    endTime: Date;
    timeClass: string;
    timeControl: string | null;
    rules: string | null;
    rated: boolean;
    eco: string | null;
    ecoUrl: string | null;
    resultPerspective: string;
    colorPerspective: string;
    whiteUsername: string;
    blackUsername: string;
    whiteRating: number | null;
    blackRating: number | null;
    whiteResult: string | null;
    blackResult: string | null;
    whiteAccuracy: number | null;
    blackAccuracy: number | null;
  },
  username: string
): GameListItemDto => {
  const normalizedUsername = username.toLowerCase();
  const isWhitePerspective = game.colorPerspective === 'white';
  const whiteUsernameLower = game.whiteUsername.toLowerCase();
  const blackUsernameLower = game.blackUsername.toLowerCase();

  const opponentUsername = isWhitePerspective
    ? whiteUsernameLower === normalizedUsername
      ? game.blackUsername
      : game.whiteUsername
    : blackUsernameLower === normalizedUsername
      ? game.whiteUsername
      : game.blackUsername;

  return {
    id: game.id,
    url: game.url,
    endTime: toUnix(game.endTime),
    timeClass: game.timeClass,
    timeControl: game.timeControl,
    rules: game.rules,
    rated: game.rated,
    eco: game.eco,
    ecoUrl: game.ecoUrl,
    result: game.resultPerspective as ResultPerspective,
    color: game.colorPerspective as ColorPerspective,
    opponentUsername,
    playerRating: isWhitePerspective ? game.whiteRating : game.blackRating,
    opponentRating: isWhitePerspective ? game.blackRating : game.whiteRating,
    whiteResult: game.whiteResult,
    blackResult: game.blackResult,
    whiteAccuracy: game.whiteAccuracy,
    blackAccuracy: game.blackAccuracy
  };
};

export const getGames = async (filters: GamesFilters): Promise<GameListDto> => {
  const player = await resolvePlayer(filters.username);
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));

  const where = buildBaseWhere(player.id, filters);

  if (filters.result) {
    where.resultPerspective = filters.result;
  }
  if (filters.color) {
    where.colorPerspective = filters.color;
  }
  if (filters.eco) {
    where.eco = {
      contains: filters.eco,
      mode: 'insensitive'
    };
  }
  if (filters.search) {
    where.OR = [
      {
        whiteUsername: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        blackUsername: {
          contains: filters.search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy: {
        endTime: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        url: true,
        endTime: true,
        timeClass: true,
        timeControl: true,
        rules: true,
        rated: true,
        eco: true,
        ecoUrl: true,
        resultPerspective: true,
        colorPerspective: true,
        whiteUsername: true,
        blackUsername: true,
        whiteRating: true,
        blackRating: true,
        whiteResult: true,
        blackResult: true,
        whiteAccuracy: true,
        blackAccuracy: true
      }
    })
  ]);

  return {
    username: player.username,
    page,
    pageSize,
    total,
    items: rows.map((row) => mapGameToListItem(row, player.username))
  };
};

export const getGameDetail = async (
  gameId: number,
  input: {
    username?: string;
  }
): Promise<GameDetailDto> => {
  const player = await resolvePlayer(input.username);
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      playerId: player.id
    },
    select: {
      id: true,
      url: true,
      endTime: true,
      timeClass: true,
      timeControl: true,
      rules: true,
      rated: true,
      eco: true,
      ecoUrl: true,
      resultPerspective: true,
      colorPerspective: true,
      whiteUsername: true,
      blackUsername: true,
      whiteRating: true,
      blackRating: true,
      whiteResult: true,
      blackResult: true,
      whiteAccuracy: true,
      blackAccuracy: true,
      pgn: true,
      tcn: true,
      fen: true
    }
  });

  if (!game) {
    throw new HttpError(404, `Game ${gameId} not found.`);
  }

  return {
    username: player.username,
    game: {
      ...mapGameToListItem(game, player.username),
      pgn: game.pgn,
      tcn: game.tcn,
      fen: game.fen,
      whiteUsername: game.whiteUsername,
      blackUsername: game.blackUsername
    }
  };
};
