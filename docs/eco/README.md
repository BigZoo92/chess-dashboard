# Eco Optimization Notes

## Before
- Landing and dashboard were bundled in one React SPA.
- Production was effectively running `docker:dev`, exposing `/@vite/client` and `/@react-refresh`.
- `robots.txt` fell through to SPA HTML fallback.
- Heavy libs (`recharts`, `lucide-react`) were part of the same app bundle boundary.
- API responses had no demonstrable cache headers (`X-Cache`, `ETag`, `Cache-Control`).

## After
- New static Astro landing app at `apps/landing`, served at `/`.
- Hero image rendered in initial HTML with preload + `fetchpriority="high"` + explicit dimensions.
- React dashboard remains in `apps/web`, served at `/dashboard` only.
- Dashboard production base path is `/dashboard/` (including JS/CSS assets at `/dashboard/assets/*`).
- Dev/prod split:
  - `docker-compose.yml`: local dev with hot reload.
  - `docker-compose.prod.yml`: production build (no Vite dev client).
- Dashboard routing env:
  - `VITE_BASE_PATH=/dashboard/`
  - `VITE_ROUTER_BASENAME=/dashboard`
- Reverse proxy (`apps/proxy`) handles:
  - routing (`/`, `/dashboard`, `/api`)
  - security headers (CSP, HSTS, COOP, XFO, nosniff, referrer-policy)
  - compression (gzip + zstd)
  - static cache policy (immutable hashed assets)
- API cache layer added for expensive GET endpoints with:
  - `X-Cache: MISS|HIT|STALE`
  - `Cache-Control: max-age + stale-while-revalidate`
  - `ETag` + conditional `304`
  - invalidation on `/api/sync`

## Lighthouse Local Run
Production-mode local stack:

```bash
pnpm up:prod
```

Dockploy target:
- compose file: `docker-compose.prod.yml`
- public entrypoint: proxy service (`apps/proxy`)

Landing:

```bash
npx lighthouse http://localhost:8080 --preset=desktop --view
```

Dashboard:

```bash
npx lighthouse http://localhost:8080/dashboard --preset=desktop --view
```

Note:
- In restricted Windows shells, `astro build` can fail with `spawn EPERM` (Vite Windows realpath optimization).
- Verify landing build through `docker compose -f docker-compose.prod.yml build proxy` in a normal Docker-enabled environment.

## Cache Verification
First request (expected MISS):

```bash
curl -i "http://localhost:8080/api/stats/summary?username=<USERNAME>"
```

Second identical request (expected HIT):

```bash
curl -i "http://localhost:8080/api/stats/summary?username=<USERNAME>"
```

Conditional request with ETag (expected 304):

```bash
curl -i \
  -H 'If-None-Match: "<etag-from-previous-response>"' \
  "http://localhost:8080/api/stats/summary?username=<USERNAME>"
```

Dev-only cache status endpoint:

```bash
curl -i "http://localhost:3001/api/cache/status"
```

## Payload Reduction Summary
- Landing moved out of React app to static Astro output.
- Hero placeholder path prepared at `apps/landing/public/images/hero-placeholder.jpg` for later compressed replacement.
- React routes are lazy-loaded (`Dashboard`, `Openings`, `Habits`, `Games`, `Settings`).
- `recharts` moved to lazy-loaded chart module (`apps/web/src/components/dashboard-charts.tsx`).
- `lucide-react` removed from the dashboard code path.
- Vite build configured for explicit chunking and production minification.

## No Dev Artifacts Check
When prod stack is up (`pnpm up:prod`):

```bash
curl -s http://localhost:8080/dashboard | findstr "@vite/client @react-refresh"
```

Expected: no output.
