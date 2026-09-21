# Transjakarta Network Intelligence

A full-stack data engineering project that turns official Transjakarta GTFS snapshots into an explorable view of Jakarta's public transport network.

The project covers the complete path from ingestion to presentation: idempotent GTFS loading, feed-version change detection, dimensional marts, a read-only FastAPI service, and a responsive React dashboard with real route geometry.

## What It Does

- Downloads and validates official Transjakarta static GTFS feeds.
- Loads versioned routes, stops, trips, stop times, shapes, and calendars into PostgreSQL.
- Detects added, removed, and modified records between feed versions.
- Builds analytics marts for service coverage, headways, and operating spans.
- Serves paginated, parameterized, read-only API endpoints.
- Draws every available direction and shape variant on a real Jakarta map.
- Provides route, service, feed-change, and architecture views in one dashboard.

> This is a static GTFS intelligence system. It does not show live vehicles, traffic, ETAs, or GTFS-Realtime data.

## Architecture

```text
Official GTFS ZIP
       │
       ▼
Extract & validate ──► Raw schema (versioned source records)
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          CDC change log            Staging schema
                                           │
                                           ▼
                               Marts / dimensional model
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                     FastAPI read API          Operational analytics
                              │
                              ▼
                 React dashboard + Leaflet map
```

PostgreSQL is the source of truth. `marts.fact_trip` and related marts represent the latest transformed feed, while raw, staging, and CDC tables preserve version-aware pipeline history.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Database | PostgreSQL + PostGIS |
| Pipeline | Python, Requests, Psycopg |
| API | FastAPI, Pydantic, SlowAPI |
| Frontend | React, TypeScript, Vite |
| Map | Leaflet + configurable raster tiles |
| Charts | Recharts |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS + project design tokens |

## Prerequisites

- Python 3.11 or newer
- PostgreSQL with PostGIS available
- Node.js 20 or newer
- `psql` on your shell path

## Local Setup

### 1. Clone and configure the environment

```bash
git clone https://github.com/Pence420/TransJakarta-analysis.git
cd TransJakarta-analysis

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
```

Update `.env` with your local database credentials. The API should use the read-only `dashboard_reader` role.

### 2. Initialize PostgreSQL

Run the SQL files in order:

```bash
psql -U postgres -f sql/01_setup_database.sql
psql -U postgres -d transjakarta_gtfs -f sql/02_setup_schemas.sql
psql -U postgres -d transjakarta_gtfs -f sql/03_setup_roles.sql
psql -U postgres -d transjakarta_gtfs -f sql/04_setup_raw_tables.sql
psql -U postgres -d transjakarta_gtfs -f sql/05_setup_cdc_tables.sql
```

### 3. Run the data pipeline

```bash
# Complete extract → load → CDC → transform flow
python scripts/run_pipeline.py

# Individual stages
python scripts/run_extract_load.py
python scripts/run_cdc_diff.py
python scripts/run_transform.py
```

Pipeline runs are idempotent for the same feed snapshot. A new file hash creates a new feed version and enables CDC comparison with the previous snapshot.

### 4. Start the API

```bash
.venv/bin/uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Useful URLs:

- API health: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

Interactive documentation is intentionally restricted to localhost.

### 5. Start the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Vite proxies `/api` requests to the FastAPI server on port `8000`.

## Map Configuration

The development default uses OpenStreetMap raster tiles and requires no API key. The actual Transjakarta paths and stop locations always come from the project's GTFS database—not from the tile provider.

For deployment, set a production tile provider in `frontend/.env.local` or your hosting environment:

```bash
VITE_MAP_TILE_URL=https://your-tile-provider.example/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION="&copy; Your map provider"
```

Keep the required provider attribution visible. OpenStreetMap's public tile service is appropriate for local development but has no commercial SLA; use a suitable hosted provider for public production traffic.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/api/routes` | Paginated route directory |
| `GET` | `/api/routes/{route_id}` | One route |
| `GET` | `/api/routes/{route_id}/map-data` | Active-feed shapes and served stops |
| `GET` | `/api/stops` | Paginated stop directory |
| `GET` | `/api/coverage` | Stop and station coverage marts |
| `GET` | `/api/headway` | Headway analytics by route and hour |
| `GET` | `/api/service-span` | First/last departure and service span |
| `GET` | `/api/feed-versions` | Available feed snapshots |
| `GET` | `/api/feed-versions/{id}/changes` | Route, stop, and schedule CDC records |

Example:

```bash
curl 'http://127.0.0.1:8000/api/routes/13/map-data'
curl 'http://127.0.0.1:8000/api/routes/JAK.01/map-data'
```

Route IDs support Transjakarta's real identifier format, including Mikrotrans IDs containing periods such as `JAK.01`.

## Testing and Quality Checks

Run the backend regression suite:

```bash
.venv/bin/python -m unittest discover -s tests -v
```

Run frontend validation:

```bash
cd frontend
npm run lint
npm run build
```

The backend tests cover:

- Transjakarta route-ID validation, including Mikrotrans identifiers.
- Unsafe identifier rejection.
- Active-feed shape joins using `feed_version_id`.
- Longitude and latitude range validation.

## Security Model

- The pipeline and API use separate PostgreSQL roles.
- `dashboard_reader` connections are opened as read-only and autocommit.
- Dynamic values are passed as query parameters rather than interpolated SQL.
- API requests are rate-limited.
- CORS allows only the configured local frontend origins by default.
- Credentials live in `.env`, which must not be committed.
- Public error responses do not expose database exception details.

## Project Structure

```text
transjakarta/
├── api/                 # FastAPI routes, models, database access
├── cdc/                 # Feed-to-feed change detection
├── docs/                # Phase documentation and design specs
├── extract/             # GTFS download and parsing
├── frontend/            # React dashboard
├── load/                # Idempotent raw-schema loading
├── scripts/             # Pipeline and scheduler entry points
├── sql/                 # Database, schemas, roles, and raw tables
├── tests/               # Backend regression tests
├── transform/           # Staging and mart SQL transformations
├── config.py            # Central pipeline configuration
└── requirements.txt     # Python runtime dependencies
```

## Detailed Documentation

| Phase | Document |
| --- | --- |
| Foundation | [`docs/01-foundation.md`](docs/01-foundation.md) |
| Extract and load | [`docs/02-extract-load.md`](docs/02-extract-load.md) |
| CDC diff engine | [`docs/03-cdc-diff.md`](docs/03-cdc-diff.md) |
| Transformations | [`docs/04-transform.md`](docs/04-transform.md) |
| Orchestration | [`docs/05-orchestration.md`](docs/05-orchestration.md) |
| API layer | [`docs/06a-api-layer.md`](docs/06a-api-layer.md) |
| Frontend | [`docs/06b-frontend.md`](docs/06b-frontend.md) |
| Geographic map design | [`docs/superpowers/specs/2026-09-21-geographic-transjakarta-map-design.md`](docs/superpowers/specs/2026-09-21-geographic-transjakarta-map-design.md) |

## Known Boundaries

- Static GTFS only; no vehicle telemetry or realtime arrival prediction.
- Public map deployment needs a tile provider suitable for expected traffic.
- API pagination is offset-based and intended for this portfolio-scale dataset.
- The frontend production bundle currently emits Vite's large-chunk advisory; functionality is unaffected, but route-level code splitting is the next performance improvement for a larger deployment.

## License

Personal portfolio project. Add a formal license before accepting external contributions or redistribution.
