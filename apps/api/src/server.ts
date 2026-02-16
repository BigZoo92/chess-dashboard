import cors from '@fastify/cors';
import Fastify from 'fastify';
import { z } from 'zod';
import type { HelloResponse } from '@ecoconception/shared';

import { ChessComHttpError } from './chesscom/client.js';
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

await fastify.register(cors, {
  origin: config.corsOrigin
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

fastify.post('/api/sync', async (request) => {
  const body = parseOrThrow(syncBodySchema, request.body ?? {});
  const result = await runSync(body);
  return result;
});

fastify.get('/api/sync/status', async (request) => {
  const query = parseOrThrow(
    z.object({
      username: z.string().trim().min(1).optional()
    }),
    request.query ?? {}
  );
  return getSyncStatus(query);
});

fastify.get('/api/stats/summary', async (request) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  return getSummaryStats(query);
});

fastify.get('/api/stats/rating-series', async (request) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  return getRatingSeries(query);
});

fastify.get('/api/stats/openings', async (request) => {
  const query = parseOrThrow(openingsQuerySchema, request.query ?? {});
  return getOpeningsStats(query);
});

fastify.get('/api/stats/streaks', async (request) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  return getStreaksStats(query);
});

fastify.get('/api/stats/time-heatmap', async (request) => {
  const query = parseOrThrow(commonQuerySchema, request.query ?? {});
  return getTimeHeatmap(query);
});

fastify.get('/api/games', async (request) => {
  const query = parseOrThrow(gamesQuerySchema, request.query ?? {});
  return getGames(query);
});

fastify.get('/api/games/:id', async (request) => {
  const params = parseOrThrow(
    z.object({
      id: z.coerce.number().int().positive()
    }),
    request.params ?? {}
  );
  const query = parseOrThrow(gameDetailQuerySchema, request.query ?? {});
  return getGameDetail(params.id, query);
});

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
