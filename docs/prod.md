# Production Smoke Test

## Start production stack

```bash
docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml up -d --build
```

## Verify routes

```bash
curl -i http://localhost:8080/
curl -i http://localhost:8080/dashboard/
curl -i http://localhost:8080/api/health
```

Expected:
- `/` -> `200` and landing HTML
- `/dashboard/` -> `200` and dashboard HTML
- `/api/health` -> `200` with `{"ok":true}`

## Verify SEO files

```bash
curl -i http://localhost:8080/robots.txt
curl -i http://localhost:8080/sitemap.xml
pnpm check:robots -- http://localhost:8080/robots.txt
```

Expected for `robots.txt`:
- Status `200`
- `Content-Type: text/plain; charset=utf-8`
- Only standard robots directives (`User-agent`, `Allow`, `Disallow`, `Sitemap`, `Crawl-delay`, `Host`).

`robots.txt` source is maintained in `apps/landing/src/pages/robots.txt.ts` (Astro route).
Do not add non-standard directives such as `Content-Signal` in this file.
If AI-training controls are needed, apply them with page-level meta tags or route-specific HTTP headers, not robots directives.

## Debug if failing

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --no-color --tail=200 web proxy api
docker compose -f docker-compose.prod.yml exec web sh -lc "curl -i http://api:3001/health"
```

## Note

`docker-compose.prod.yml` includes both `web` and `proxy` service names for deployment compatibility.
Both services run the same Caddy image build from `apps/proxy/Dockerfile`.
