# Fase 6b: Frontend (React + MapLibre + Recharts)

## Apa yang Dikerjain

Fase ini bikin **interactive dashboard** dengan peta, chart, dan card grid untuk visualisasi data Transjakarta GTFS.

## Design

**Dihadaptasi dari [KOI Thé](https://www.koithe.com/en/main.php):**
- Floating pill navigation dengan icon buttons
- Clean light mode dengan generous whitespace
- Card-based content dengan rounded corners (16px)
- Glass-morphism effect pada nav
- Subtle shadows dan hover transitions

## Tech Stack

- **Vite + React 18 + TypeScript**
- **MapLibre GL JS** — WebGL map rendering
- **Recharts** — Bar charts
- **TanStack Query** — Data fetching & caching
- **React Router v6** — Page routing
- **Tailwind CSS** — Styling
- **Lucide React** — Icons

## File Structure

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router + providers
│   ├── index.css             # Tailwind + theme
│   ├── api/
│   │   └── client.ts         # API fetch functions
│   ├── components/
│   │   ├── Layout.tsx        # Main layout wrapper
│   │   ├── TopNav.tsx        # Floating pill navigation
│   │   ├── MapPanel.tsx      # MapLibre map
│   │   ├── MetricCard.tsx    # Reusable metric card
│   │   ├── ChartCard.tsx     # Chart wrapper
│   │   ├── DataTable.tsx     # Sortable table
│   │   └── LoadingState.tsx  # Loading spinner
│   ├── pages/
│   │   ├── RoutesPage.tsx    # Map + route list
│   │   ├── HeadwayPage.tsx   # Headway charts
│   │   ├── CoveragePage.tsx  # Coverage by zone
│   │   ├── ChangesPage.tsx   # Feed changes card grid
│   │   └── AboutPage.tsx     # Project info
│   └── types/
│       └── index.ts          # TypeScript types
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Cara Jalankan

```bash
# Development
cd frontend
npm install
npm run dev

# Build production
npm run build
# Output: dist/
```

Dev server: `http://localhost:5173` (auto-proxy `/api` ke `http://localhost:8000`)

## Pages

### Routes (`/`)
- Peta MapLibre dengan stop markers
- Route list cards (klik untuk highlight di peta)
- Metric cards: total routes, total stops

### Headway (`/headway`)
- Bar chart headway per jam
- Filter per route
- Tabel detail: avg, min, max headway

### Coverage (`/coverage`)
- Bar chart stops per zone
- Horizontal bar chart service hours per route
- Zone cards: total stops, unique stations

### Changes (`/changes`)
- Select feed version
- Summary cards: ADDED (hijau), REMOVED (merah), MODIFIED (kuning)
- Card grid perubahan dengan before/after values

### About (`/about`)
- Feature cards
- Tech stack
- Architecture principles (9 principles)

## Color Palette

```
Primary:    #003478 (biru Transjakarta)
Background: #F8F9FA
Surface:    #FFFFFF
Border:     #E8EAED
Text:       #1A1A2E
Muted:      #6B7280
Success:    #2E7D32 (ADDED)
Danger:     #C62828 (REMOVED)
Warning:    #E65100 (MODIFIED)
```

## Key Features

- **Floating pill nav** — glass-morphism effect, icon-only
- **MapLibre GL** — WebGL rendering, performa untuk ribuan markers
- **TanStack Query** — caching, auto-refetch, loading states
- **Gradient charts** — Recharts dengan gradient fills
- **Card grid changes** — colored badges per change type
- **Responsive** — mobile-friendly layout
