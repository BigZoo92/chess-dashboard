import cors from '@fastify/cors';
import Fastify from 'fastify';
import { z } from 'zod';
import type { HelloResponse } from '@ecoconception/shared';

import { ChessComHttpError } from './chesscom/client.js';
import { buildCacheKey, cachedJsonResponse, ResponseCache } from './cache/response-cache.js';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { prisma } from './prisma.js';
import {
  getGameDetail,
  getGames,
  getOpeningsStats,
  getRatingSeries,
  getStreaksStats,
  getSummaryStats,
  getTimeHeatmap
} from './services/stats-service.js';
import { getSyncStatus, runSync } from './services/sync-service.js';

const fastify = Fastify({
  logger: true
});
const responseCache = new ResponseCache(300);

await fastify.register(cors, {
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed`), false);
  }
});

const commonQuerySchema = z.object({
  username: z.string().trim().min(1).optional(),
  timeClass: z.enum(['bullet', 'blitz', 'rapid', 'daily', 'unknown']).optional(),
  from: z.coerce.number().int().positive().optional(),
  to: z.coerce.number().int().positive().optional()
});

const syncBodySchema = z.object({
  username: z.string().trim().min(1).optional(),
  full: z.boolean().optional()
});

const gamesQuerySchema = commonQuerySchema.extend({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  result: z.enum(['win', 'loss', 'draw']).optional(),
  color: z.enum(['white', 'black']).optional(),
  eco: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional()
});

const openingsQuerySchema = commonQuerySchema.extend({
  minGames: z.coerce.number().int().positive().optional()
});

const gameDetailQuerySchema = z.object({
  username: z.string().trim().min(1).optional()
});

const parseOrThrow = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  throw new HttpError(400, parsed.error.errors.map((error) => error.message).join(', '));
};

fastify.get('/health', async () => ({ ok: true }));

fastify.get<{ Reply: HelloResponse }>('/api/hello', async () => {
  await prisma.$queryRaw`SELECT 1`;
  const playersCount = await prisma.player.count();
  return {
    message: 'Hello from Fastify + Prisma',
    db: {
      ok: true,
      playersCount
    }
  };
});

fastify.post('/api/sync', async (request, reply) => {
  const body = parseOrThrow(syncBodySchema, request.body ?? {});
  const result = await runSync(body);
  responseCache.invalidateTags(['stats', 'games', 'sync-status']);
  reply.header('Cache-Control', 'no-store');
  reply.header('X-Cache', 'BYPASS');
  return result;
});

fastify.get('/api/sync/status', async (request, reply) => {
  const query = parseOrThrow(
    z.object({
      username: z.string().trim().min(1).optional()
    }),
    request.query ?? {}
  );

  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('sync-status', request),
      maxAgeSeconds: 5,
      staleWhileRevalidateSeconds: 10,
      tags: ['sync-status']
    },
    () => getSyncStatus(query),
    (error) => fastify.log.warn({ err: error }, 'sync-status background refresh failed')
  );
});

fastify.get('/api/stats/summary', async (request, reply) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('stats-summary', request),
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 120,
      tags: ['stats']
    },
    () => getSummaryStats(query),
    (error) => fastify.log.warn({ err: error }, 'stats-summary background refresh failed')
  );
});

fastify.get('/api/stats/rating-series', async (request, reply) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('stats-rating-series', request),
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 120,
      tags: ['stats']
    },
    () => getRatingSeries(query),
    (error) => fastify.log.warn({ err: error }, 'stats-rating-series background refresh failed')
  );
});

fastify.get('/api/stats/openings', async (request, reply) => {
  const query = parseOrThrow(openingsQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('stats-openings', request),
      maxAgeSeconds: 30,
      staleWhileRevalidateSeconds: 120,
      tags: ['stats']
    },
    () => getOpeningsStats(query),
    (error) => fastify.log.warn({ err: error }, 'stats-openings background refresh failed')
  );
});

fastify.get('/api/stats/streaks', async (request, reply) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('stats-streaks', request),
      maxAgeSeconds: 30,
      staleWhileRevalidateSeconds: 120,
      tags: ['stats']
    },
    () => getStreaksStats(query),
    (error) => fastify.log.warn({ err: error }, 'stats-streaks background refresh failed')
  );
});

fastify.get('/api/stats/time-heatmap', async (request, reply) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('stats-time-heatmap', request),
      maxAgeSeconds: 30,
      staleWhileRevalidateSeconds: 120,
      tags: ['stats']
    },
    () => getTimeHeatmap(query),
    (error) => fastify.log.warn({ err: error }, 'stats-time-heatmap background refresh failed')
  );
});

fastify.get('/api/games', async (request, reply) => {
  const query = parseOrThrow(gamesQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('games-list', request),
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 60,
      tags: ['games']
    },
    () => getGames(query),
    (error) => fastify.log.warn({ err: error }, 'games-list background refresh failed')
  );
});

fastify.get('/api/games/:id', async (request, reply) => {
  const params = parseOrThrow(
    z.object({
      id: z.coerce.number().int().positive()
    }),
    request.params ?? {}
  );
  const query = parseOrThrow(gameDetailQuerySchema, request.query ?? {});
  await cachedJsonResponse(
    request,
    reply,
    responseCache,
    {
      key: buildCacheKey('games-detail', request, { id: params.id }),
      maxAgeSeconds: 60,
      staleWhileRevalidateSeconds: 120,
      tags: ['games']
    },
    () => getGameDetail(params.id, query),
    (error) => fastify.log.warn({ err: error }, 'games-detail background refresh failed')
  );
});

if (process.env.NODE_ENV !== 'production') {
  fastify.get('/api/cache/status', async () => responseCache.stats());
}

fastify.setErrorHandler((error, _request, reply) => {
  if (error instanceof HttpError) {
    reply.status(error.statusCode).send({
      error: error.message
    });
    return;
  }

  if (error instanceof ChessComHttpError) {
    const statusCode = error.statusCode === 404 ? 404 : 502;
    reply.status(statusCode).send({
      error: error.message
    });
    return;
  }

  fastify.log.error(error);
  reply.status(500).send({
    error: 'Internal server error'
  });
});

fastify.addHook('onClose', async () => {
  await prisma.$disconnect();
});

await fastify.listen({
  port: config.apiPort,
  host: '0.0.0.0'
});
