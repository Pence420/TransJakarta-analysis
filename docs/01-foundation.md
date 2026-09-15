# Fase 1: Foundation

## Apa yang Dikerjain

Fase ini setup **fondasi** seluruh proyek: database Postgres + PostGIS, skema tabel, roles keamanan, dan struktur folder project.

## Struktur Project

```
transjakarta/
├── .env.example          # Template environment variables (copy ke .env)
├── .gitignore            # File yang di-ignore git
├── config.py             # Central config: DB connection, GTFS URL
├── requirements.txt      # Python dependencies
├── extract/              # Script download & parse GTFS (Fase 2)
├── load/                 # Script load data ke Postgres (Fase 2)
├── cdc/                  # CDC diff engine (Fase 3)
├── transform/            # SQL transformations (Fase 4)
├── api/                  # FastAPI application (Fase 6a)
├── scripts/              # Orchestration scripts (Fase 5)
├── frontend/             # React app (Fase 6b)
├── sql/                  # Database setup SQL files
│   ├── 01_setup_database.sql
│   ├── 02_setup_schemas.sql
│   ├── 03_setup_roles.sql
│   ├── 04_setup_raw_tables.sql
│   └── 05_setup_cdc_tables.sql
└── docs/                 # Dokumentasi per fase
```

## Database Setup

### Schemas (4 skema terpisah)

| Schema | Fungsi | Siapa yang Akses |
|--------|--------|------------------|
| `raw` | Mirror data GTFS apa adanya + metadata | `etl_writer` (R/W) |
| `cdc` | Change tracking, feed version history | `etl_writer` (R/W) |
| `staging` | Data bersih & tertipisasi | `etl_writer` (R/W) |
| `marts` | Dimensional models siap analisis | `etl_writer` (R), `dashboard_reader` (R) |

### Roles (2 role terpisah)

| Role | Fungsi | Akses |
|------|--------|-------|
| `etl_writer` | Jalankan pipeline ETL | FULL: raw, cdc, staging. READ: marts |
| `dashboard_reader` | Serve data ke frontend/API | READ ONLY: marts |

**Kenapa dipisah?** Biar kalau API bocor, attacker cuma bisa baca data yang udah di-aggregate di marts — gak bisa nyentuh raw data atau inject data via CDC.

## Tabel Raw

### `cdc.feed_versions`
Tracking setiap kali GTFS feed di-fetch. Tiap row = satu snapshot feed.
- `feed_version_id` — auto-increment ID
- `file_hash` — SHA256 hash file GTFS (buat cek duplikat)
- `fetch_timestamp` — kapan data di-fetch

### `raw.routes`, `raw.stops`, `raw.trips`, `raw.stop_times`, `raw.shapes`, `raw.calendar`
Mirror struktur GTFS asli, ditambah kolom:
- `feed_version_id` — link ke versi feed mana
- `loaded_at` — timestamp kapan data di-load

**Primary key composite** `(feed_version_id, entity_id)` — memungkinkan multiple snapshots dari entity yang sama di versi berbeda.

## Tabel CDC

### `cdc.route_changes`, `cdc.stop_changes`, `cdc.schedule_changes`
Append-only log perubahan antar versi feed:
- `change_type`: `ADDED` / `REMOVED` / `MODIFIED`
- `field_changed` — kolom apa yang berubah
- `old_value` / `new_value` — sebelum vs sesudah

## Cara Setup

```bash
# 1. Copy env
cp .env.example .env
# Edit .env, ganti password-nya!

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup database (jalankan sebagai postgres superuser)
psql -U postgres -f sql/01_setup_database.sql
psql -U postgres -d transjakarta_gtfs -f sql/02_setup_schemas.sql
psql -U postgres -d transjakarta_gtfs -f sql/03_setup_roles.sql
psql -U postgres -d transjakarta_gtfs -f sql/04_setup_raw_tables.sql
psql -U postgres -d transjakarta_gtfs -f sql/05_setup_cdc_tables.sql
```

## Config (`config.py`)

Pusat konfigurasi. Baca dari `.env` via `python-dotenv`:
- `DB_CONFIG` — dict koneksi Postgres
- `GTFS_FEED_URL` — URL sumber data GTFS Transjakarta

## Next

Lanjut ke **Fase 2: Extract & Load** — script download GTFS zip, parse CSV, dan load ke schema `raw`.
