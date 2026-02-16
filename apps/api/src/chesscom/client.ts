import { config } from '../config.js';
import type {
  ChessComArchivesResponse,
  ChessComMonthlyGamesResponse,
  ChessComPlayerProfile,
  ChessComStats
} from './types.js';

const CHESSCOM_BASE_URL = 'https://api.chess.com/pub';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ChessComHttpError extends Error {
  public readonly statusCode: number;

  public readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'ChessComHttpError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

class ConcurrencyLimiter {
  private running = 0;

  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  private async acquire() {
    if (this.running < this.concurrency) {
      this.running += 1;
      return;
    }

    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.running += 1;
  }

  private release() {
    this.running -= 1;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }
}

const retriableStatusCodes = new Set([429, 500, 502, 503, 504]);

export class ChessComClient {
  private readonly limiter: ConcurrencyLimiter;

  private rateLimitChain: Promise<void> = Promise.resolve();

  private nextAllowedAt = 0;

  constructor(
    private readonly userAgent: string,
    private readonly rateLimitMs: number,
    concurrency: number
  ) {
    this.limiter = new ConcurrencyLimiter(Math.max(1, concurrency));
  }

  private async waitRateLimitWindow() {
    let release: () => void = () => undefined;
    const lock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.rateLimitChain;
    this.rateLimitChain = previous.then(() => lock);

    await previous;
    const delay = Math.max(0, this.nextAllowedAt - Date.now());
    if (delay > 0) {
      await sleep(delay);
    }
    this.nextAllowedAt = Date.now() + this.rateLimitMs;
    release();
  }

  private async requestJson<T>(url: string): Promise<T> {
    return this.limiter.run(async () => {
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await this.waitRateLimitWindow();

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent
          }
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const body = await response.text();
        const shouldRetry = retriableStatusCodes.has(response.status) && attempt < maxAttempts - 1;

        if (shouldRetry) {
          const retryAfter = Number(response.headers.get('retry-after') || 0);
          const backoffMs =
            retryAfter > 0 ? retryAfter * 1000 : this.rateLimitMs * Math.pow(2, attempt + 1);
          await sleep(backoffMs);
          continue;
        }

        throw new ChessComHttpError(
          `Chess.com request failed (${response.status}) for ${url}`,
          response.status,
          body
        );
      }

      throw new Error(`Request retries exhausted for ${url}`);
    });
  }

  async getPlayer(username: string) {
    const url = `${CHESSCOM_BASE_URL}/player/${encodeURIComponent(username)}`;
    return this.requestJson<ChessComPlayerProfile>(url);
  }

  async getStats(username: string) {
    const url = `${CHESSCOM_BASE_URL}/player/${encodeURIComponent(username)}/stats`;
    return this.requestJson<ChessComStats>(url);
  }

  async getArchives(username: string) {
    const url = `${CHESSCOM_BASE_URL}/player/${encodeURIComponent(username)}/games/archives`;
    const response = await this.requestJson<ChessComArchivesResponse>(url);
    return response.archives || [];
  }

  async getMonthlyGamesByUrl(url: string) {
    return this.requestJson<ChessComMonthlyGamesResponse>(url);
  }

  async getMonthlyGames(username: string, year: number, month: number) {
    const paddedMonth = String(month).padStart(2, '0');
    const url = `${CHESSCOM_BASE_URL}/player/${encodeURIComponent(username)}/games/${year}/${paddedMonth}`;
    return this.requestJson<ChessComMonthlyGamesResponse>(url);
  }
}

export const chessComClient = new ChessComClient(
  config.chessCom.userAgent,
  config.chessCom.rateLimitMs,
  config.chessCom.concurrency
);

export { ChessComHttpError };
