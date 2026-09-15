# Fase 4: Transform (In-Warehouse SQL)

## Apa yang Dikerjain

Fase ini mentransformasi data dari **raw** → **staging** → **marts** menggunakan SQL langsung di dalam Postgres (ELT pattern, bukan ETL).

## Flow

```
[raw.*] --> 01_staging.sql --> [staging.*] --> 02_marts.sql --> [marts.*]
```

## File yang Dibikin

| File | Fungsi |
|------|--------|
| `transform/01_staging.sql` | Cleaning, dedup, type casting dari raw ke staging |
| `transform/02_marts.sql` | Dimensional model: dim tables, fact tables, aggregate marts |
| `scripts/run_transform.py` | Runner script |

## Cara Pakai

```bash
python scripts/run_transform.py
```

## Staging Layer

Bersihin data dari raw:

| Tabel Staging | Transformasi |
|---------------|-------------|
| `staging.routes` | Dedup, trim strings, uppercase color codes |
| `staging.stops` | Dedup, trim, default location_type=0 |
| `staging.trips` | Dedup, trim |
| `staging.stop_times` | Dedup, default pickup/drop_off type |
| `staging.shapes` | Dedup |
| `staging.calendar` | Dedup |

**Dedup pakai `DISTINCT ON`** — ambil baris paling baru (loaded_at DESC) untuk setiap kombinasi PK.

## Marts Layer (Dimensional Model)

### Dimension Tables

| Tabel | Isi |
|-------|-----|
| `dim_route` | Latest snapshot semua routes |
| `dim_stop` | Latest snapshot semua stops + PostGIS geometry |
| `dim_time` | Date dimension (expand calendar ke daily rows) |
| `dim_feed_version` | Metadata semua feed versions |

### Fact Tables

| Tabel | Granularity |
|-------|-------------|
| `fact_trip` | Satu row per trip (latest version) |
| `fact_stop_time` | Satu row per stop_time (latest version) |

### Aggregate Marts

| Tabel | Insight |
|-------|---------|
| `mart_coverage_by_area` | Jumlah stops per zone_id |
| `mart_headway_by_route_hour` | Rata-rata headway (gap antar trip) per route per jam |
| `mart_service_span` | Jam operasional pertama & terakhir per route |

## Kenapa SQL langsung, bukan dbt?

Di PRD disebutkan "opsional pakai dbt-postgres". Untuk fase ini, SQL langsung dipilih karena:
1. Lebih gak ada dependency tambahan
2. Pipeline masih sederhana (3 layer)
3. Kalau mau upgrade ke dbt nanti, SQL-nya tinggal dipindah ke model `.sql` dbt

## Next

Lanjut ke **Fase 5: Orchestration** — scheduler otomatis untuk jalanin pipeline berurutan.
