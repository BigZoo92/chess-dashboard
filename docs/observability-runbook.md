# Observability Runbook (Grafana + Prometheus + Pyroscope + k6)

## 1) Inventaire actuel du repo

### Services Docker identifiés

| Service                  | Fichier                                         |        Port hote |   Port container | Exposition     |
| ------------------------ | ----------------------------------------------- | ---------------: | ---------------: | -------------- |
| `proxy` (Caddy dev/prod) | `docker-compose.yml`, `docker-compose.prod.yml` |           `8080` |             `80` | public local   |
| `api` (Fastify)          | `docker-compose.yml`, `docker-compose.prod.yml` |           `3001` |           `3001` | public local   |
| `db` (Postgres 16)       | `docker-compose.yml`                            |           `5432` |           `5432` | public local   |
| `web` (Vite dev)         | `docker-compose.yml`                            |           `5173` |           `5173` | public local   |
| `landing` (Astro dev)    | `docker-compose.yml`                            |           `4321` |           `4321` | public local   |
| `grafana`                | `docker-compose.observability.yml`              | `127.0.0.1:3000` |           `3000` | localhost only |
| `prometheus`             | `docker-compose.observability.yml`              |             none |           `9090` | interne Docker |
| `pyroscope`              | `docker-compose.observability.yml`              |             none |           `4040` | interne Docker |
| `tempo`                  | `docker-compose.observability.yml`              |             none |           `3200` | interne Docker |
| `loki`                   | `docker-compose.observability.yml`              |             none |           `3100` | interne Docker |
| `promtail`               | `docker-compose.observability.yml`              |             none |           `9080` | interne Docker |
| `otel-collector`         | `docker-compose.observability.yml`              |             none | `4317/4318/9464` | interne Docker |
| `k6`                     | `docker-compose.observability.yml`              |             none |              n/a | job ponctuel   |

### Configs observability

- Prometheus scrape: `apps/observability/prometheus/prometheus.yml`
- OTel Collector: `apps/observability/otel-collector/config.yml`
- Datasources Grafana: `apps/observability/grafana/provisioning/datasources/observability.yml`
- Dashboards Grafana: `apps/observability/grafana/provisioning/dashboards/observability.yml`
- Dashboard JSON existant: `apps/observability/grafana/provisioning/dashboards/json/api-runtime-overview.json`
- Scripts k6: `apps/observability/k6/scripts/smoke.js`, `apps/observability/k6/scripts/ramp.js`, `apps/observability/k6/scripts/cache-hit.js`

### Connexions entre services

- Tous les services partagent le réseau Docker `ecoconception_default`.
- `api` envoie traces+metrics OTLP vers `otel-collector:4318`.
- `otel-collector` exporte:
  - traces vers Tempo (`tempo:4318`)
  - métriques Prometheus sur `:9464`
  - span metrics (`traces_spanmetrics_*`) pour RPS/latence/5xx.
- Prometheus scrape `otel-collector:9464` et `prometheus:9090`.
- Grafana est provisionné avec datasources: Prometheus, Loki, Tempo, Pyroscope.
- Pyroscope est initialisé côté API via `apps/api/src/observability/init.ts`.

### Prérequis

1. Docker + Docker Compose v2 (support `--profile`).
2. `.env` avec au minimum:
   - `OBSERVABILITY_ENABLED=1`
   - `GRAFANA_ADMIN_USER=...`
   - `GRAFANA_ADMIN_PASSWORD=...`
3. RAM conseillée: 6 a 8 Go minimum pour stack app + observability.

### Pièges courants

1. Ports occupés: `3000`, `3001`, `5432`, `8080`.
2. Depuis un container, utiliser noms de services (`api`, `prometheus`), pas `localhost`.
3. `k6` est un job ponctuel: il peut apparaitre `Exited (0)` apres execution, c'est normal.
4. Endpoints stats renvoient `404` si aucun joueur sync (faire un `/api/sync` avant tests lourds).
5. Windows/Docker Desktop: `promtail` peut echouer (mount `/var/run/docker.sock` et `/var/lib/docker/containers`).

## 2) Lancement local (recommande)

### Demarrage

```powershell
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability up -d --build
```

### Verification rapide

```powershell
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability ps
curl -sS http://localhost:8080/health
curl -sS http://localhost:3001/health
curl -sS http://localhost:3000/api/health
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability logs --no-color --tail=100 api otel-collector prometheus grafana pyroscope
```

### Arret / nettoyage

```powershell
# Stop sans supprimer volumes
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability stop

# Stop + suppression containers/reseaux (volumes conserves)
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability down --remove-orphans

# Reset complet (ATTENTION: supprime DB + series Prometheus + Grafana data)
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability down -v --remove-orphans
```

## 3) Lancement prod (optionnel, securise)

Par defaut, garder observability non exposee publiquement.

- Grafana est deja limite a `127.0.0.1:3000`.
- Prometheus, Pyroscope, Loki, Tempo ne publient aucun port hote.

### Demarrage prod + observability

```powershell
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --profile observability up -d --build
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --profile observability ps
curl -sS http://localhost:8080/health
curl -sS http://localhost:3001/health
curl -sS http://localhost:3000/api/health
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --profile observability logs --no-color --tail=100 web api grafana prometheus pyroscope
```

### Acces recommande en prod: tunnel SSH

```bash
ssh -L 3000:127.0.0.1:3000 USER@SERVER
```

Puis ouvrir `http://localhost:3000` en local.

### Si exposition publique obligatoire (option, non appliquee ici)

1. Reverse proxy TLS obligatoire.
2. Basic auth minimale.
3. Allowlist IP/VPN.
4. Ne pas exposer Prometheus/Pyroscope/Loki/Tempo en direct.

Exemple de reverse proxy (reference, non applique):

```caddy
grafana.example.com {
  tls ops@example.com
  basicauth {
    admin $2a$14$REPLACE_WITH_BCRYPT_HASH
  }
  @blocked not remote_ip 203.0.113.0/24 198.51.100.17
  respond @blocked "Forbidden" 403
  reverse_proxy 127.0.0.1:3000
}
```

Rollback: retirer la conf d'exposition, puis relancer:

```powershell
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --profile observability up -d
```

Arret prod:

```powershell
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml --profile observability down --remove-orphans
```

## 4) Grafana: login, datasources, dashboards

### Acces

1. Ouvrir `http://localhost:3000`.
2. Login avec `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`.
3. Aller a `Connections > Data sources`:
   - `Prometheus` (UID `prometheus`)
   - `Loki` (UID `loki`)
   - `Tempo` (UID `tempo`)
   - `Pyroscope` (UID `pyroscope`)

### Dashboard existant

- `Dashboards > Observability > API Runtime Overview`
- Preuves qu'il fournit deja:
  - `API Throughput` (RPS)
  - `API Latency p95`
  - `API Error Rate 5xx`
  - `Event Loop Lag`
  - `Heap Usage`
  - `API Logs` (Loki)

### Dashboards a ajouter (minimal, sans import internet)

1. `Frontend/Web (proxy + API)`:
   - RPS global API
   - p95/p99 latence API
   - 4xx/5xx rates
   - payload moyen (`http_response_size` si dispo via instrumentation future)
2. `API Node Runtime`:
   - event loop lag
   - heap used
   - erreurs 5xx
   - debit des endpoints critiques (`/api/stats/*`, `/api/games`)
3. `DB/Postgres`:
   - appels DB (via `db_system="postgresql"` span metrics)
   - p95 latence spans DB
   - connexions DB (si postgres-exporter ajoute)
4. `Cache`:
   - preuve par headers (`X-Cache`, `Age`, `ETag`) via curl/DevTools
   - option instrumentation compteur `cache_hit_total`, `cache_miss_total`.

## 5) Prometheus: metriques pour ton rapport eco

### MVP (10 users)

1. Lighthouse (perf/accessibilite/best-practices).
2. Coverage JS/CSS (Chrome DevTools Coverage).
3. Taille payloads et nombre de requetes.

Prometheus complete ici via API health + latence baseline.

### Palier 10k users

1. RPS par endpoint.
2. p95/p99 latence API.
3. Taux 5xx.
4. Efficacite cache via headers + statut 304.

### Palier 1M users

1. Saturation CPU/memoire.
2. Throttling CPU.
3. Stabilité erreurs/timeouts.
4. Cout runtime (profil CPU/allocs Pyroscope).

### PromQL pretes a l'emploi

```promql
# RPS API
sum(rate(traces_spanmetrics_calls_total{service_name="api"}[1m]))
```

```promql
# Error rate 5xx
sum(rate(traces_spanmetrics_calls_total{service_name="api",http_status_code=~"5.."}[5m]))
/
clamp_min(sum(rate(traces_spanmetrics_calls_total{service_name="api"}[5m])), 0.0001)
```

```promql
# Latence p95
histogram_quantile(0.95, sum by (le) (rate(traces_spanmetrics_duration_milliseconds_bucket{service_name="api"}[5m])))
```

```promql
# Latence p99
histogram_quantile(0.99, sum by (le) (rate(traces_spanmetrics_duration_milliseconds_bucket{service_name="api"}[5m])))
```

```promql
# Event loop lag API (ms)
avg({__name__=~"nodejs_eventloop_lag_mean_ms|nodejs_eventloop_lag_mean",service_name="api"})
```

```promql
# Heap usage API (bytes)
avg({__name__=~"nodejs_memory_heap_used_bytes|nodejs_memory_heap_used",service_name="api"})
```

```promql
# Appels DB (si spans DB presentes)
sum(rate(traces_spanmetrics_calls_total{service_name="api",db_system="postgresql"}[5m]))
```

```promql
# Latence DB p95 (si spans DB presentes)
histogram_quantile(
  0.95,
  sum by (le) (
    rate(traces_spanmetrics_duration_milliseconds_bucket{service_name="api",db_system="postgresql"}[5m])
  )
)
```

### Option instrumentation minimale (si metriques infra manquantes)

Actuellement, CPU/memoire conteneur et connexions Postgres ne sont pas scrapees.
Ajouter en option:

1. `cAdvisor` pour `container_cpu_usage_seconds_total`, `container_memory_working_set_bytes`, throttling.
2. `postgres-exporter` pour `pg_stat_activity_count`, etc.
3. `prom-client` dans API pour compteurs `cache_hit_total` / `cache_miss_total`.

Exemples PromQL apres ajout:

```promql
# CPU par service compose (cAdvisor)
sum by (container_label_com_docker_compose_service) (
  rate(container_cpu_usage_seconds_total{container_label_com_docker_compose_service!=""}[5m])
)
```

```promql
# Memoire par service compose (cAdvisor)
sum by (container_label_com_docker_compose_service) (
  container_memory_working_set_bytes{container_label_com_docker_compose_service!=""}
)
```

```promql
# Saturation/throttling CPU
sum by (container_label_com_docker_compose_service) (
  rate(container_cpu_cfs_throttled_seconds_total{container_label_com_docker_compose_service!=""}[5m])
)
```

```promql
# Connexions Postgres (postgres-exporter)
sum(pg_stat_activity_count)
```

## 6) Pyroscope: protocole de profiling utile

1. Ouvrir Grafana `Explore`.
2. Datasource: `Pyroscope`.
3. Service: `api` (appName configure via `OTEL_SERVICE_NAME`).
4. Type: CPU puis Allocations.
5. Lire le flamegraph:
   - plus la barre est large, plus le cout CPU/alloc est eleve
   - zoomer sur fonctions dominantes et chaines d'appels.
6. Fonctions suspectes a verifier:
   - parsing JSON massif
   - compression
   - crypto/hash
   - tri sur gros tableaux
   - regex couteuses
   - loops O(n2)

### Protocole experimental avant/apres

1. Baseline: lancer `ramp.js` pendant 3-5 min.
2. Capturer screenshot flamegraph CPU + Alloc.
3. Appliquer une optimisation (cache, payload reduction, requete DB, algo).
4. Rejouer le meme test k6.
5. Reprendre screenshots.
6. Comparer:
   - p95/p99
   - error rate
   - hotspots CPU
   - allocations.

## 7) k6: scenarios pour rapport

### Smoke (MVP, 1-5 VUs)

Script: `apps/observability/k6/scripts/smoke.js`

```powershell
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability run --rm k6 run --out experimental-prometheus-rw /scripts/smoke.js
```

### Ramp (10k simulation progressive)

Script: `apps/observability/k6/scripts/ramp.js`

```powershell
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability run --rm `
  -e K6_USERNAME=YOUR_CHESS_USERNAME `
  -e K6_RAMP_MAX_VUS=80 `
  k6 run --out experimental-prometheus-rw /scripts/ramp.js
```

### Stress controle + resilience (palier 1M, option)

```powershell
# Stress plus fort (sur machine locale puissante uniquement)
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability run --rm `
  -e K6_USERNAME=YOUR_CHESS_USERNAME `
  -e K6_RAMP_MAX_VUS=250 `
  k6 run --out experimental-prometheus-rw /scripts/ramp.js
```

```powershell
# Test resilience: redemarrer API pendant un run k6 et observer erreurs/recovery
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability restart api
```

### Cache proof (HIT/MISS + ETag)

Script: `apps/observability/k6/scripts/cache-hit.js`

```powershell
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability run --rm `
  -e K6_CACHE_PATH=/api/stats/summary `
  -e K6_USERNAME=YOUR_CHESS_USERNAME `
  k6 run /scripts/cache-hit.js
```

### Export resultats JSON/CSV (pour PDF)

```powershell
New-Item -ItemType Directory -Force apps/observability/k6/results | Out-Null
$ROOT = ((Resolve-Path .).Path -replace '\\','/')
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability run --rm `
  -v "${ROOT}/apps/observability/k6/results:/results" `
  -e K6_USERNAME=YOUR_CHESS_USERNAME `
  k6 run --summary-export=/results/ramp-summary.json --out json=/results/ramp-metrics.json /scripts/ramp.js
```

```powershell
Get-Content apps/observability/k6/results/ramp-metrics.json |
  ForEach-Object { $_ | ConvertFrom-Json } |
  Where-Object { $_.type -eq "Point" -and $_.metric -eq "http_req_duration" } |
  Select-Object @{n="time";e={$_.data.time}}, @{n="value_ms";e={$_.data.value}} |
  Export-Csv apps/observability/k6/results/ramp-http_req_duration.csv -NoTypeInformation
```

## 8) Preuve technique cache HIT/MISS

### Commandes curl exactes

```powershell
# 1) MISS attendu (premier appel)
curl -i "http://localhost:8080/api/stats/summary?username=YOUR_CHESS_USERNAME"
```

```powershell
# 2) HIT attendu (appel identique)
curl -i "http://localhost:8080/api/stats/summary?username=YOUR_CHESS_USERNAME"
```

```powershell
# 3) 304 attendu avec ETag
curl -i -H "If-None-Match: ETAG_FROM_PREVIOUS_RESPONSE" "http://localhost:8080/api/stats/summary?username=YOUR_CHESS_USERNAME"
```

Headers preuve a capturer en screenshot:

1. `X-Cache: MISS` puis `X-Cache: HIT` (ou `STALE`).
2. `Age` qui augmente.
3. `Cache-Control` (`max-age`, `stale-while-revalidate`).
4. `ETag` et `304 Not Modified` au conditional request.

### DevTools Chrome

1. Ouvrir `Network`.
2. Cocher `Preserve log`.
3. Rejouer 2 appels identiques.
4. Ouvrir un appel et screenshot onglet `Headers`.

### Provoquer MISS puis HIT

1. MISS: nouvel URL, cache vide, ou juste apres invalider via `POST /api/sync`.
2. HIT: meme URL juste apres, sans changer query params.

## 9) Checklist preuves pour le PDF avant/apres

1. Screenshot Grafana `API Throughput`, `Latency p95/p99`, `5xx`.
2. Screenshot flamegraph Pyroscope (CPU + alloc) avant et apres.
3. Screenshot headers cache (`MISS`, `HIT`, `Age`, `ETag`, `304`).
4. Export k6:
   - `ramp-summary.json`
   - `ramp-http_req_duration.csv`.
5. Lighthouse:
   - `npx lighthouse http://localhost:8080 --preset=desktop --view`
   - `npx lighthouse http://localhost:8080/dashboard --preset=desktop --view`.
6. Tableau de comparaison final (baseline vs optimisation):
   - p95/p99
   - taux 5xx
   - RPS
   - hotpath CPU
   - taille/payload/requetes front.
