# Transjakarta Network Intelligence Pipeline

> Data engineering pipeline untuk mengolah data GTFS Transjakarta menjadi insight jaringan transportasi publik Jakarta.

## Overview

Pipeline ini memproses data GTFS (routes, stops, trips, stop_times, shapes, calendar) dari feed resmi Transjakarta menggunakan pola **ELT** dengan **Postgres + PostGIS** sebagai single source of truth.

### Fitur Utama

- **Extract & Load** — Download GTFS zip, parse CSV, upsert ke Postgres (idempotent)
- **CDC Diff Engine** — Track perubahan jaringan antar versi feed (ADDED/REMOVED/MODIFIED)
- **Transform** — SQL transformations: raw → staging → marts (dimensional model)
- **Orchestration** — Automated pipeline dengan cron scheduling
- **API Layer** — FastAPI read-only endpoints dengan role-based access
- **Dashboard** — React + MapLibre + Recharts interactive dashboard

## Arsitektur

```
[GTFS Static Feed (.zip)] → [Extract] → [Load] → [raw schema Postgres]
                                                          |
                                            [CDC diff engine]
                                                          |
                                            [change_log tables]
                                                          |
                                      [Transform: raw → staging → marts]
                                                          |
                              [Serve: FastAPI → React Dashboard + API]
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Postgres + PostGIS |
| Backend | Python 3 (ETL scripts) |
| API | FastAPI + Pydantic |
| Frontend | React + Vite + TypeScript |
| Map | MapLibre GL JS |
| Charts | Recharts |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS |

## Quick Start

### 1. Setup Database

```bash
# Jalankan SQL files berurutan
psql -U postgres -f sql/01_setup_database.sql
psql -U postgres -d transjakarta_gtfs -f sql/02_setup_schemas.sql
psql -U postgres -d transjakarta_gtfs -f sql/03_setup_roles.sql
psql -U postgres -d transjakarta_gtfs -f sql/04_setup_raw_tables.sql
psql -U postgres -d transjakarta_gtfs -f sql/05_setup_cdc_tables.sql
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env, ganti password-nya
pip install -r requirements.txt
```

### 3. Run Pipeline

```bash
# Full pipeline
python scripts/run_pipeline.py

# Atau step-by-step
python scripts/run_extract_load.py
python scripts/run_cdc_diff.py
python scripts/run_transform.py
```

### 4. Start API Server

```bash
uvicorn api.main:app --reload --port 8000
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`

## Dokumentasi Per Fase

| Fase | Dokumentasi |
|------|-------------|
| 1. Foundation | [docs/01-foundation.md](docs/01-foundation.md) |
| 2. Extract & Load | [docs/02-extract-load.md](docs/02-extract-load.md) |
| 3. CDC Diff Engine | [docs/03-cdc-diff.md](docs/03-cdc-diff.md) |
| 4. Transform | [docs/04-transform.md](docs/04-transform.md) |
| 5. Orchestration | [docs/05-orchestration.md](docs/05-orchestration.md) |
| 6a. API Layer | [docs/06a-api-layer.md](docs/06a-api-layer.md) |
| 6b. Frontend | [docs/06b-frontend.md](docs/06b-frontend.md) |

## Project Structure

```
transjakarta/
├── sql/                    # Database setup
├── extract/                # Download & parse GTFS
├── load/                   # Load ke Postgres
├── cdc/                    # CDC diff engine
├── transform/              # SQL transformations
├── scripts/                # Runners & scheduler
├── api/                    # FastAPI application
├── frontend/               # React dashboard
├── docs/                   # Documentation per fase
├── config.py               # Central config
├── requirements.txt        # Python dependencies
└── .env.example            # Environment template
```

## Security

- **Role-based access**: `etl_writer` (pipeline) vs `dashboard_reader` (API)
- **Read-only API**: Dashboard reader hanya bisa SELECT
- **Parameterized queries**: Semua query pakai `%s`, gak ada string concat
- **CORS restricted**: Hanya allow frontend origin
- **Credentials in .env**: Gak di-commit ke git

## Architecture Principles

Proyek ini mengikuti **9 Principles of Good Data Architecture** (Reis & Housley):

1. Choose common components wisely
2. Plan for failure — idempotent loads
3. Architect for scalability
4. Architecture is leadership
5. Always be architecting
6. Build loosely coupled systems
7. Make reversible decisions
8. Prioritize security
9. Embrace FinOps

## License

Personal project for portfolio.
