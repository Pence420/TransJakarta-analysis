# Fase 3: CDC Diff Engine

## Apa yang Dikerjain

Fase ini membandingkan **dua snapshot GTFS terakhir** (feed version) dan mencatat semua perubahan ke tabel `cdc.route_changes`, `cdc.stop_changes`, `cdc.schedule_changes`.

## Flow

```
[cdc.feed_versions] --> get latest 2 version IDs
        |
[raw.routes/stops/trips @ version N] vs [raw.* @ version N-1]
        |
   Compare:
   - ADDED   (ada di baru, gak ada di lama)
   - REMOVED (ada di lama, gak ada di baru)
   - MODIFIED (ada di kedua, tapi field berubah)
        |
   Insert ke cdc.route_changes / cdc.stop_changes / cdc.schedule_changes
```

## File yang Dibikin

| File | Fungsi |
|------|--------|
| `cdc/diff_engine.py` | Logic diff: routes, stops, schedules |
| `scripts/run_cdc_diff.py` | Script runner untuk CDC diff |

## Cara Pakai

```bash
python scripts/run_cdc_diff.py
```

## Change Types

| Type | Artinya |
|------|---------|
| `ADDED` | Entity baru muncul di feed version terbaru |
| `REMOVED` | Entity hilang dari feed version terbaru |
| `MODIFIED` | Entity ada di kedua versi, tapi salah satu field berubah |

## Tabel CDC

### `cdc.route_changes`
| Kolom | Tipe | Fungsi |
|-------|------|--------|
| `change_id` | SERIAL | Auto-increment ID |
| `feed_version_id` | INT | Versi feed baru |
| `prev_version_id` | INT | Versi feed lama |
| `route_id` | TEXT | ID route yang berubah |
| `change_type` | TEXT | ADDED / REMOVED / MODIFIED |
| `field_changed` | TEXT | Nama kolom yang berubah (NULL untuk ADDED/REMOVED) |
| `old_value` | TEXT | Nilai sebelum (NULL untuk ADDED) |
| `new_value` | TEXT | Nilai sesudah (NULL untuk REMOVED) |
| `detected_at` | TIMESTAMPTZ | Kapan perubahan terdeteksi |

`cdc.stop_changes` dan `cdc.schedule_changes` punya struktur serupa.

## Fields yang Di-diff

**Routes:** `route_short_name`, `route_long_name`, `route_desc`, `route_type`, `route_url`, `route_color`, `route_text_color`

**Stops:** `stop_name`, `stop_desc`, `stop_lat`, `stop_lon`, `zone_id`, `location_type`, `parent_station`

**Trips/Schedules:** `route_id`, `service_id`, `trip_headsign`, `direction_id`, `shape_id`

## Kenapa Pakai Row-by-Row Comparison?

Karena skala data Transjakarta (~236 routes, ~8400 stops, ~ribuan trips) masih manageable. Kalau datanya udah puluhan juta baris, bisa di-upgrade ke:
- **Temporal tables** (Postgres 12+) — native system versioning
- **Logical replication** — real-time CDC tanpa batch diff
- **Hash-based diff** — hash semua field, bandingkan hash-nya (lebih cepat)

Tapi untuk proyek ini, row-by-row cukup dan lebih mudah di-debug.

## Next

Lanjut ke **Fase 4: Transform** — SQL transformations dari raw → staging → marts (dimensional model).
