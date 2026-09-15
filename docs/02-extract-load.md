# Fase 2: Extract & Load

## Apa yang Dikerjain

Fase ini mengambil data GTFS Transjakarta dari sumber resmi, mem-parse CSV-nya, dan load ke schema `raw` di Postgres dengan **upsert idempotent** (bisa dijalankan berulang tanpa duplikat).

## Flow

```
[GTFS ZIP URL] --> [download.py] --> [gtfs_transjakarta.zip]
                                            |
                                     [unzip] --> [gtfs_extracted/]
                                            |
                                     [parser.py] --> dict of parsed CSV rows
                                            |
                                     [loader.py] --> Postgres raw schema
                                            |
                                     [cdc.feed_versions] --> version record
```

## File yang Dibikin

| File | Fungsi |
|------|--------|
| `extract/download.py` | Download ZIP dari URL, unzip, compute SHA256 hash |
| `extract/parser.py` | Parse semua CSV GTFS, cast types ke Python/SQL types |
| `load/loader.py` | Upsert ke tabel raw Postgres (idempotent) |
| `scripts/run_extract_load.py` | Orchestrator: jalankan extract → parse → load |

## Cara Pakai

```bash
python scripts/run_extract_load.py
```

## Kenapa Upsert, bukan INSERT?

**Idempotency** (Prinsip #2: Plan for failure). Kalau pipeline gagal setelah download tapi sebelum load selesai, bisa dijalankan ulang tanpa bikin duplikat data. `ON CONFLICT ... DO UPDATE` menangani ini.

## Tabel yang Di-load

| GTFS File | Tabel Postgres | Primary Key |
|-----------|----------------|-------------|
| `routes.txt` | `raw.routes` | `(feed_version_id, route_id)` |
| `stops.txt` | `raw.stops` | `(feed_version_id, stop_id)` |
| `trips.txt` | `raw.trips` | `(feed_version_id, trip_id)` |
| `stop_times.txt` | `raw.stop_times` | `(feed_version_id, trip_id, stop_sequence)` |
| `shapes.txt` | `raw.shapes` | `(feed_version_id, shape_id, shape_pt_sequence)` |
| `calendar.txt` | `raw.calendar` | `(feed_version_id, service_id)` |

## Feed Version Tracking

Tiap kali pipeline jalan, `cdc.feed_versions` dapat row baru dengan:
- `feed_version_id` — auto-increment
- `file_hash` — SHA256 (bisa cek apakah feed berubah atau sama)
- `file_size_bytes` — ukuran ZIP

Kalau hash sama dengan versi sebelumnya, itu artinya feed belum update. Tapi tetap di-load (upsert, bukan insert) supaya data tetap fresh.

## Dependencies

- `psycopg2-binary` — Postgres driver
- `python-dotenv` — baca `.env`
- `requests` — download file

## Next

Lanjut ke **Fase 3: CDC Diff Engine** — membandingkan snapshot baru vs snapshot sebelumnya dan mencatat perubahan di `cdc.route_changes`, `cdc.stop_changes`, `cdc.schedule_changes`.
