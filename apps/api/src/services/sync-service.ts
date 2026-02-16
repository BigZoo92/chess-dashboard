import { chessComClient } from '../chesscom/client.js';
import type { ChessComGame } from '../chesscom/types.js';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { prisma } from '../prisma.js';
import type { ColorPerspective, ResultPerspective, SyncStatusDto } from '@ecoconception/shared';
import type { Prisma } from '@prisma/client';

const drawResults = new Set([
  'agreed',
  'stalemate',
  'repetition',
  'insufficient',
  '50move',
  'timevsinsufficient'
]);

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const toPerspectiveResult = (rawResult: string | undefined): ResultPerspective => {
  const normalized = (rawResult || '').toLowerCase();
  if (normalized === 'win') {
    return 'win';
  }
  if (drawResults.has(normalized)) {
    return 'draw';
  }
  return 'loss';
};

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toJsonInput = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

type ArchiveEntry = {
  url: string;
  year: number;
  month: number;
};

const parseArchiveEntry = (url: string): ArchiveEntry | null => {
  const match = /\/games\/(\d{4})\/(\d{2})$/.exec(url);
  if (!match) {
    return null;
  }

  return {
    url,
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10)
  };
};

const selectArchiveUrls = (archiveUrls: string[], full: boolean): string[] => {
  const parsedEntries = archiveUrls
    .map(parseArchiveEntry)
    .filter((entry): entry is ArchiveEntry => entry !== null)
    .sort((a, b) => {
      if (a.year === b.year) {
        return b.month - a.month;
      }
      return b.year - a.year;
    });

  const selection = full ? parsedEntries : parsedEntries.slice(0, config.chessCom.maxMonths);
  return selection
    .sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month;
      }
      return a.year - b.year;
    })
    .map((entry) => entry.url);
};

const getPerspectiveFromGame = (
  game: ChessComGame,
  username: string
): { color: ColorPerspective; result: ResultPerspective } | null => {
  const normalized = normalizeUsername(username);
  const whiteUsername = game.white.username ? normalizeUsername(game.white.username) : '';
  const blackUsername = game.black.username ? normalizeUsername(game.black.username) : '';

  if (whiteUsername === normalized) {
    return {
      color: 'white',
      result: toPerspectiveResult(game.white.result)
    };
  }

  if (blackUsername === normalized) {
    return {
      color: 'black',
      result: toPerspectiveResult(game.black.result)
    };
  }

  return null;
};

type SyncState = {
  isSyncing: boolean;
  username: string | null;
};

const syncState: SyncState = {
  isSyncing: false,
  username: null
};

export type SyncInput = {
  username?: string;
  full?: boolean;
};

export type SyncResult = {
  username: string;
  full: boolean;
  monthsSynced: number;
  gamesUpserted: number;
  gamesSkipped: number;
  lastSyncAt: string;
};

const resolveUsername = (username?: string) => {
  const candidate = username?.trim() || config.chessCom.defaultUsername;
  if (!candidate) {
    throw new HttpError(400, 'username is required. Provide it in body or CHESSCOM_USERNAME env.');
  }
  return candidate;
};

export const runSync = async (input: SyncInput): Promise<SyncResult> => {
  const username = resolveUsername(input.username);
  const full = Boolean(input.full);

  if (syncState.isSyncing) {
    throw new HttpError(409, 'A sync is already running. Try again in a moment.');
  }

  syncState.isSyncing = true;
  syncState.username = username;

  try {
    const [profileJson, statsJson, archiveUrls] = await Promise.all([
      chessComClient.getPlayer(username),
      chessComClient.getStats(username),
      chessComClient.getArchives(username)
    ]);

    const selectedArchiveUrls = selectArchiveUrls(archiveUrls, full);

    const player = await prisma.player.upsert({
      where: {
        username
      },
      create: {
        username,
        profileJson: toJsonInput(profileJson),
        statsJson: toJsonInput(statsJson)
      },
      update: {
        profileJson: toJsonInput(profileJson),
        statsJson: toJsonInput(statsJson)
      }
    });

    let gamesUpserted = 0;
    let gamesSkipped = 0;

    for (const archiveUrl of selectedArchiveUrls) {
      const monthlyPayload = await chessComClient.getMonthlyGamesByUrl(archiveUrl);
      for (const game of monthlyPayload.games || []) {
        if (!game.url || !game.end_time || !game.white || !game.black) {
          gamesSkipped += 1;
          continue;
        }

        const perspective = getPerspectiveFromGame(game, username);
        if (!perspective) {
          gamesSkipped += 1;
          continue;
        }

        const whiteUsername = game.white.username || '';
        const blackUsername = game.black.username || '';

        await prisma.game.upsert({
          where: {
            url: game.url
          },
          create: {
            playerId: player.id,
            url: game.url,
            pgn: game.pgn || null,
            endTime: new Date(game.end_time * 1000),
            timeClass: game.time_class || 'unknown',
            timeControl: game.time_control || null,
            rules: game.rules || null,
            rated: game.rated ?? true,
            tcn: game.tcn || null,
            fen: game.fen || null,
            eco: game.eco || null,
            ecoUrl: game.eco_url || null,
            whiteUsername,
            blackUsername,
            whiteRating: toNumber(game.white.rating),
            blackRating: toNumber(game.black.rating),
            whiteResult: game.white.result || null,
            blackResult: game.black.result || null,
            whiteAccuracy: toNumber(game.accuracies?.white),
            blackAccuracy: toNumber(game.accuracies?.black),
            resultPerspective: perspective.result,
            colorPerspective: perspective.color
          },
          update: {
            playerId: player.id,
            pgn: game.pgn || null,
            endTime: new Date(game.end_time * 1000),
            timeClass: game.time_class || 'unknown',
            timeControl: game.time_control || null,
            rules: game.rules || null,
            rated: game.rated ?? true,
            tcn: game.tcn || null,
            fen: game.fen || null,
            eco: game.eco || null,
            ecoUrl: game.eco_url || null,
            whiteUsername,
            blackUsername,
            whiteRating: toNumber(game.white.rating),
            blackRating: toNumber(game.black.rating),
            whiteResult: game.white.result || null,
            blackResult: game.black.result || null,
            whiteAccuracy: toNumber(game.accuracies?.white),
            blackAccuracy: toNumber(game.accuracies?.black),
            resultPerspective: perspective.result,
            colorPerspective: perspective.color
          }
        });

        gamesUpserted += 1;
      }
    }

    const updatedPlayer = await prisma.player.update({
      where: {
        id: player.id
      },
      data: {
        lastSyncAt: new Date()
      },
      select: {
        lastSyncAt: true
      }
    });

    return {
      username,
      full,
      monthsSynced: selectedArchiveUrls.length,
      gamesUpserted,
      gamesSkipped,
      lastSyncAt: updatedPlayer.lastSyncAt?.toISOString() || new Date().toISOString()
    };
  } finally {
    syncState.isSyncing = false;
    syncState.username = null;
  }
};

export const getSyncStatus = async (input: { username?: string }): Promise<SyncStatusDto> => {
  const username = input.username?.trim() || config.chessCom.defaultUsername || null;
  if (!username) {
    return {
      username: null,
      lastSyncAt: null,
      totals: {
        games: 0
      },
      isSyncing: syncState.isSyncing
    };
  }

  const player = await prisma.player.findUnique({
    where: {
      username
    },
    select: {
      id: true,
      lastSyncAt: true
    }
  });

  if (!player) {
    return {
      username,
      lastSyncAt: null,
      totals: {
        games: 0
      },
      isSyncing: syncState.isSyncing
    };
  }

  const games = await prisma.game.count({
    where: {
      playerId: player.id
    }
  });

  return {
    username,
    lastSyncAt: player.lastSyncAt?.toISOString() || null,
    totals: {
      games
    },
    isSyncing: syncState.isSyncing
  };
};
