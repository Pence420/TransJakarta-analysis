# Fase 6b: Frontend (React + Leaflet + Recharts)

## Ringkasan

Frontend adalah dashboard responsif untuk membaca hasil pipeline GTFS: network overview, peta koridor Jakarta, analisis headway, perubahan antar feed, dan penjelasan arsitektur project.

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router
- TanStack Query
- Leaflet
- Recharts
- Tailwind CSS v4
- Lucide React

## Halaman

| Route | Fungsi |
| --- | --- |
| `/` | Overview jaringan, service window, headway, dan map utama |
| `/map` | Peta interaktif dengan directory seluruh koridor |
| `/headway` | Analisis interval keberangkatan per jam dan route |
| `/changes` | Perubahan route, stop, dan schedule antar feed version |
| `/about` | Landing page produk dan arsitektur data |

Island navigation tetap tersedia pada semua halaman. Layout menggunakan palette graphite, warm cream, dan sage dengan fokus pada data density serta keterbacaan.

## Peta

`src/components/MapView.tsx` mengelola lifecycle Leaflet, tile basemap, native pan/zoom/pinch, route polylines, stop markers, popup, route selector, dan error state.

Data geografi berasal dari:

```text
GET /api/routes/{route_id}/map-data
```

Setiap GTFS shape digambar dalam koordinat Jakarta asli. Direction utama memakai garis solid dan direction sebaliknya memakai garis putus-putus. Stop yang tampil dapat diklik untuk membaca nama dan kode halte.

Tile default menggunakan OpenStreetMap untuk development. Deployment dapat mengganti provider tanpa mengubah komponen:

```bash
VITE_MAP_TILE_URL=https://provider.example/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION="&copy; Provider"
```

## Struktur Utama

```text
frontend/src/
├── components/
│   ├── IslandNav.tsx
│   ├── Layout.tsx
│   ├── MapView.tsx
│   ├── DataTable.tsx
│   └── LoadingState.tsx
├── lib/
│   ├── api.ts
│   ├── format.ts
│   └── types.ts
├── pages/
│   ├── OverviewPage.tsx
│   ├── NetworkPage.tsx
│   ├── HeadwayPage.tsx
│   ├── ChangesPage.tsx
│   └── AboutPage.tsx
├── App.tsx
├── index.css
└── main.tsx
```

## Menjalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite berjalan di `http://127.0.0.1:5173` dan mem-proxy `/api` ke FastAPI pada port `8000`.

## Quality Checks

```bash
npm run lint
npm run build
```

UI menyediakan skip link, keyboard focus state, reduced-motion fallback, form labels, loading/error states, serta layout peta terpisah untuk desktop dan mobile.
