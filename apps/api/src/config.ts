const parseIntEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  apiPort: parseIntEnv(process.env.API_PORT, 3001),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  chessCom: {
    defaultUsername: process.env.CHESSCOM_USERNAME?.trim() || '',
    userAgent:
      process.env.CHESSCOM_USER_AGENT?.trim() ||
      'ecoconception-chess-dashboard (contact: you@email.com)',
    concurrency: parseIntEnv(process.env.SYNC_CONCURRENCY, 1),
    maxMonths: parseIntEnv(process.env.SYNC_MAX_MONTHS, 36),
    rateLimitMs: parseIntEnv(process.env.SYNC_RATE_LIMIT_MS, 300)
  }
};
