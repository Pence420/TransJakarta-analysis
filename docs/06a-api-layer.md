# Fase 6a: API Layer (FastAPI)

## Apa yang Dikerjain

Fase ini bikin **read-only API** pakai FastAPI untuk serve data dari marts ke frontend. API ini cuma pakai role `dashboard_reader` (read-only) — gak bisa write/delete data.

## Flow

```
[Frontend] --> HTTP Request --> [FastAPI] --> Postgres (dashboard_reader) --> Response JSON
```

## File yang Dibikin

| File | Fungsi |
|------|--------|
| `api/main.py` | FastAPI app, CORS config, root endpoints |
| `api/database.py` | DB connection pakai dashboard_reader role |
| `api/models.py` | Pydantic response models |
| `api/routes.py` | All endpoint handlers |

## Cara Jalankan

```bash
# Development
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

API docs: `http://localhost:8000/docs`

## Endpoints

### Routes
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/routes` | List semua routes (paginated) |
| GET | `/api/routes/{route_id}` | Detail satu route |
| GET | `/api/routes/{route_id}/shape` | Shape geometry untuk route |

### Stops
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/stops` | List semua stops (paginated, filter by zone) |
| GET | `/api/stops/{stop_id}` | Detail satu stop |

### Analytics
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/coverage` | Coverage by zone |
| GET | `/api/headway` | Headway per route per jam |
| GET | `/api/headway?route_id=X` | Headway untuk route tertentu |
| GET | `/api/service-span` | Jam operasional per route |

### Feed Versions
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/feed-versions` | List semua feed versions |
| GET | `/api/feed-versions/{id}/changes` | Perubahan di versi tertentu |

### System
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/` | Service info |
| GET | `/health` | Health check |

## Security (Prinsip #8)

- **Read-only role**: API cuma pakai `dashboard_reader`, `GRANT SELECT` di marts schema
- **CORS**: Hanya allow origin `localhost:5173` dan `localhost:3000`
- **No debug mode**: `debug=False` di production
- **Parameterized queries**: Semua query pakai `%s` parameter, gak ada string concat
- **Pagination**: Semua list endpoint punya `limit` + `offset`, max 1000 rows
- **No traceback di response**: Exception handler custom

## Response Format

Semua response pakai Pydantic models, jadi kontrak API eksplisit dan gak bocorin kolom internal.

## Next

Lanjut ke **Fase 6b: Frontend** — React + MapLibre + Recharts dashboard.
