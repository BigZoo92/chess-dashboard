# Chess.com Stats Dashboard

Monorepo full-stack TypeScript:
- `apps/api`: Fastify + Prisma + Postgres + sync Chess.com
- `apps/web`: Vite + React + Tailwind + shadcn/ui (dashboard app at `/dashboard`)
- `apps/landing`: Astro + Tailwind static landing app at `/`
- `apps/proxy`: Caddy reverse proxy for routing + security/compression headers
- `packages/shared`: DTO types partages

## Setup

1. Installer deps:
```bash
pnpm i
```

2. Verifier `.env` (ou copier `.env.example`):
- `CHESSCOM_USERNAME`
- `CHESSCOM_USER_AGENT`
- `SYNC_CONCURRENCY=1`
- `SYNC_MAX_MONTHS=36`
- `SYNC_RATE_LIMIT_MS=300`
- `DATABASE_URL`
- `VITE_API_URL`

## Run

```bash
pnpm up
```

Equivalent:
```bash
docker compose up --build
```
This starts the local dev stack with Caddy proxy + Astro landing + React dashboard + API + DB.

## Stop

```bash
pnpm down
```

## URLs

- Public entrypoint (proxy): http://localhost:8080
- Landing: http://localhost:8080/
- Dashboard: http://localhost:8080/dashboard
- Web dev server: http://localhost:5173/dashboard
- Landing dev server: http://localhost:4321
- API: http://localhost:3001
- DB: localhost:5432

## First sync

1. Ouvrir `http://localhost:8080/dashboard/settings`
2. Choisir un username Chess.com
3. Cliquer `Sync now`
4. Naviguer sur Dashboard / Openings / Habits / Games

## Production compose

Run production build locally:

```bash
pnpm up:prod
```

This uses:
- static Astro build for `/`
- static React build for `/dashboard`
- API in production mode
- Caddy for path routing, compression, cache headers, and security headers
