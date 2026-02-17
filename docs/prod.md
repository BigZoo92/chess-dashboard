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

## Debug if failing

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --no-color --tail=200 web proxy api
docker compose -f docker-compose.prod.yml exec web sh -lc "curl -i http://api:3001/health"
```

## Note

`docker-compose.prod.yml` includes both `web` and `proxy` service names for deployment compatibility.
Both services run the same Caddy image build from `apps/proxy/Dockerfile`.
