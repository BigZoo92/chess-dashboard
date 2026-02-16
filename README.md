# Chess.com Stats Dashboard

Monorepo full-stack TypeScript:
- `apps/api`: Fastify + Prisma + Postgres + sync Chess.com
- `apps/web`: Vite + React + Tailwind + shadcn/ui
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

## Stop

```bash
pnpm down
```

## URLs

- Web: http://localhost:5173
- API: http://localhost:3001
- DB: localhost:5432

## First sync

1. Ouvrir `http://localhost:5173/settings`
2. Choisir un username Chess.com
3. Cliquer `Sync now`
4. Naviguer sur Dashboard / Openings / Habits / Games
