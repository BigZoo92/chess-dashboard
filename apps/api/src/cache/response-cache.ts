import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

type CacheEntry = {
  body: string;
  createdAt: number;
  etag: string;
  expiresAt: number;
  key: string;
  staleUntil: number;
  tags: Set<string>;
};

type SendFromCacheInput = {
  cacheHeader: 'HIT' | 'MISS' | 'STALE';
  entry: CacheEntry;
  maxAgeSeconds: number;
  reply: FastifyReply;
  request: FastifyRequest;
  staleWhileRevalidateSeconds: number;
};

export type CacheConfig = {
  key: string;
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds?: number;
  tags: string[];
};

const normalizeEtagHeader = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value.split(',')[0]?.trim() || null;
};

const formatCacheControl = (maxAgeSeconds: number, staleWhileRevalidateSeconds: number) =>
  `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`;

const setCachingHeaders = ({
  cacheHeader,
  entry,
  maxAgeSeconds,
  reply,
  staleWhileRevalidateSeconds
}: Omit<SendFromCacheInput, 'request'>) => {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - entry.createdAt) / 1000));
  reply.header('Cache-Control', formatCacheControl(maxAgeSeconds, staleWhileRevalidateSeconds));
  reply.header('ETag', entry.etag);
  reply.header('Vary', 'Accept-Encoding');
  reply.header('X-Cache', cacheHeader);
  reply.header('Age', String(ageSeconds));
};

const sendFromCache = ({
  cacheHeader,
  entry,
  maxAgeSeconds,
  reply,
  request,
  staleWhileRevalidateSeconds
}: SendFromCacheInput) => {
  setCachingHeaders({
    cacheHeader,
    entry,
    maxAgeSeconds,
    reply,
    staleWhileRevalidateSeconds
  });

  const ifNoneMatch = normalizeEtagHeader(request.headers['if-none-match'] as string | undefined);
  if (ifNoneMatch && ifNoneMatch === entry.etag) {
    reply.code(304).send();
    return;
  }

  reply.type('application/json; charset=utf-8').send(entry.body);
};

const serializeObject = (input: Record<string, unknown>) =>
  Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${encodeURIComponent(value.join(','))}`;
      }
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .join('&');

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as Record<string, unknown>;
};

const buildEntry = (
  key: string,
  payload: unknown,
  maxAgeSeconds: number,
  staleWhileRevalidateSeconds: number,
  tags: string[]
): CacheEntry => {
  const body = JSON.stringify(payload);
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`;
  const now = Date.now();

  return {
    body,
    createdAt: now,
    etag,
    expiresAt: now + maxAgeSeconds * 1000,
    key,
    staleUntil: now + (maxAgeSeconds + staleWhileRevalidateSeconds) * 1000,
    tags: new Set(tags)
  };
};

export const buildCacheKey = (
  routeId: string,
  request: FastifyRequest,
  extra: Record<string, unknown> = {}
): string => {
  const params = serializeObject(toRecord(request.params));
  const query = serializeObject(toRecord(request.query));
  const suffix = serializeObject(extra);

  return [routeId, params, query, suffix].filter(Boolean).join('|');
};

export class ResponseCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly refreshingKeys = new Set<string>();

  constructor(private readonly maxEntries = 300) {}

  get(key: string): CacheEntry | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  set(entry: CacheEntry) {
    if (this.entries.has(entry.key)) {
      this.entries.delete(entry.key);
    }
    this.entries.set(entry.key, entry);

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (!oldestKey) {
        break;
      }
      this.entries.delete(oldestKey);
    }
  }

  isRefreshing(key: string) {
    return this.refreshingKeys.has(key);
  }

  markRefreshing(key: string, value: boolean) {
    if (value) {
      this.refreshingKeys.add(key);
    } else {
      this.refreshingKeys.delete(key);
    }
  }

  invalidateTags(tags: string[]) {
    const wanted = new Set(tags);
    for (const [key, entry] of this.entries.entries()) {
      const shouldDelete = [...entry.tags].some((tag) => wanted.has(tag));
      if (shouldDelete) {
        this.entries.delete(key);
      }
    }
  }

  stats() {
    let fresh = 0;
    let stale = 0;
    const now = Date.now();

    for (const entry of this.entries.values()) {
      if (entry.expiresAt > now) {
        fresh += 1;
      } else if (entry.staleUntil > now) {
        stale += 1;
      }
    }

    return {
      entries: this.entries.size,
      fresh,
      stale
    };
  }
}

export const cachedJsonResponse = async <T>(
  request: FastifyRequest,
  reply: FastifyReply,
  cache: ResponseCache,
  config: CacheConfig,
  producer: () => Promise<T>,
  onBackgroundRefreshError?: (error: unknown) => void
) => {
  const staleWhileRevalidateSeconds = config.staleWhileRevalidateSeconds ?? 0;
  const now = Date.now();
  const existing = cache.get(config.key);

  if (existing && existing.expiresAt > now) {
    sendFromCache({
      cacheHeader: 'HIT',
      entry: existing,
      maxAgeSeconds: config.maxAgeSeconds,
      reply,
      request,
      staleWhileRevalidateSeconds
    });
    return;
  }

  if (existing && existing.staleUntil > now) {
    sendFromCache({
      cacheHeader: 'STALE',
      entry: existing,
      maxAgeSeconds: config.maxAgeSeconds,
      reply,
      request,
      staleWhileRevalidateSeconds
    });

    if (!cache.isRefreshing(config.key)) {
      cache.markRefreshing(config.key, true);
      void producer()
        .then((payload) => {
          cache.set(
            buildEntry(
              config.key,
              payload,
              config.maxAgeSeconds,
              staleWhileRevalidateSeconds,
              config.tags
            )
          );
        })
        .catch((error) => {
          onBackgroundRefreshError?.(error);
        })
        .finally(() => {
          cache.markRefreshing(config.key, false);
        });
    }
    return;
  }

  const payload = await producer();
  const freshEntry = buildEntry(
    config.key,
    payload,
    config.maxAgeSeconds,
    staleWhileRevalidateSeconds,
    config.tags
  );
  cache.set(freshEntry);

  sendFromCache({
    cacheHeader: 'MISS',
    entry: freshEntry,
    maxAgeSeconds: config.maxAgeSeconds,
    reply,
    request,
    staleWhileRevalidateSeconds
  });
};
