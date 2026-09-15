# Fase 5: Orchestration

## Apa yang Dikerjain

Fase ini bikin **scheduler** dan **pipeline runner** yang jalanin semua step secara berurutan: Extract → Load → CDC Diff → Transform. Dilengkapi logging dan error handling.

## Flow

```
[scheduler.py] atau [run_pipeline.py]
        |
   Step 1: Extract & Load (download GTFS, parse, upsert)
        |
   Step 2: CDC Diff (bandingkan snapshot, log changes)
        |
   Step 3: Transform (staging -> marts)
        |
   [logs/pipeline_YYYYMMDD_HHMMSS.log]
```

## File yang Dibikin

| File | Fungsi |
|------|--------|
| `scripts/run_pipeline.py` | Pipeline runner — jalankan semua atau select steps |
| `scripts/scheduler.py` | Scheduler — cron expression atau interval |

## Cara Pakai

### Jalankan pipeline sekali:
```bash
python scripts/run_pipeline.py
```

### Jalankan select steps saja:
```bash
python scripts/run_pipeline.py --steps el    # extract + load only
python scripts/run_pipeline.py --steps c     # cdc diff only
python scripts/run_pipeline.py --steps t     # transform only
python scripts/run_pipeline.py --steps elc   # extract + load + cdc
```

### Scheduler — cron expression:
```bash
python scripts/scheduler.py --cron "0 6 * * *"    # daily at 06:00 UTC
python scripts/scheduler.py --cron "0 */6 * * *"  # every 6 hours
```

### Scheduler — interval:
```bash
python scripts/scheduler.py --interval 6    # every 6 hours
```

### Scheduler — run once:
```bash
python scripts/scheduler.py --once
```

## Error Handling

**Prinsip #2: Plan for failure**

- Kalau satu step gagal, pipeline **berhenti** (gak lanjut ke step berikutnya)
- Semua output di-log ke `logs/` folder, termasuk timestamp dan status
- Exit code `1` kalau ada step yang gagal

## Logging

Setiap run bikin log file di `logs/`:
- `pipeline_YYYYMMDD_HHMMSS.log` — untuk manual run
- `scheduler_YYYYMMDD.log` — untuk scheduled run

Format: `YYYY-MM-DD HH:MM:SS [LEVEL] message`

## Cron Expression

Mendukung format cron standar:
```
minute hour day month weekday
  *     *    *    *      *
```

Contoh:
- `0 6 * * *` — setiap hari jam 06:00 UTC
- `0 */6 * * *` — setiap 6 jam
- `30 8 * * 1-5` — Senin-Jumat jam 08:30 UTC

## Next

Lanjut ke **Fase 6a: API Layer** — FastAPI endpoints untuk serve data ke frontend.
