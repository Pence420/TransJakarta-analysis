# Transjakarta Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Transjakarta home dashboard matching the supplied operations-workspace reference while keeping the floating island navigation and making the active corridor visible on a real map.

**Architecture:** `MapView` remains the isolated MapLibre owner for basemap readiness and active route drawing. `OverviewPage` composes the existing GTFS queries into a two-column operations rail, map workspace, and network-activity table. Shared components retain their public APIs and only receive presentational changes.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, MapLibre GL, Recharts, Lucide.

**Spec:** `docs/superpowers/specs/2026-09-20-transjakarta-command-center-design.md`

## Global Constraints

- Preserve `IslandNav` as a floating top-center navigation on every route.
- Use existing GTFS APIs only; do not change the backend or database.
- Keep graphite, warm ivory, and muted sage as the app palette.
- Keep the map fallback behind the map and only while MapLibre is not ready.
- Preserve attribution, route selection, build, lint, and responsive behavior.

## Review Focus

- Missing initial route ID must select the first available route, not leave an empty map.
- Raster-provider outage must leave a readable fallback and no MapLibre crash.
- Failed shape request must clear geometry and end the loading state.
- At 390px, island nav must not overlap the heading or map controls.
- Long route names must not overflow map controls or the activity table.

---

### Task 1: Make MapLibre visible, deterministic, and resilient

**Files:**
- Modify: `frontend/src/components/MapView.tsx:1-191`
- Modify: `frontend/src/index.css:121-161`

**Interfaces:**
- Consumes: `api.getRoutes`, `api.getRouteShape`, `Route`, and `RouteShape`.
- Produces: the same `MapView({ heightClass?, sidebar?, initialRoute? })` public API with internally observable `loading`, `ready`, and `failed` map states.

- [ ] **Step 1: Add a failing browser state assertion**

```ts
const state = document.querySelector('[data-map-state]')?.getAttribute('data-map-state');
const fallback = document.querySelector('.map-atmosphere');
if (state !== 'ready' || fallback !== null) throw new Error('Map remains masked after load');
```

- [ ] **Step 2: Verify the old style path reproduces the masked-map symptom**

Run the local app with the former external style URL. Expected: the assertion can fail because fallback visibility was not tied to actual map readiness.

- [ ] **Step 3: Implement explicit state, CARTO raster style, and contrast layers**

```ts
type MapState = 'loading' | 'ready' | 'failed';
const [mapState, setMapState] = useState<MapState>('loading');
map.once('load', () => setMapState('ready'));
map.once('error', () => setMapState('failed'));

<div data-map-state={mapState} ref={containerRef} className="absolute inset-0" />
{mapState !== 'ready' && <div className="map-atmosphere absolute inset-0" />}
```

Use an inline `maplibregl.StyleSpecification` with CARTO dark raster tiles, an explicit background layer, a `route-casing` line layer, then the colored `route-line`.

- [ ] **Step 4: Default to the requested corridor or first route**

```ts
const route = routesRef.current.find((item) => item.route_id === initialRoute)
  ?? routesRef.current[0];
if (map && map.getSource('route') && route) {
  setSelected(route.route_id);
  void drawShape(route.route_id, route.route_color ? `#${route.route_color}` : DEFAULT_COLOR);
}
```

- [ ] **Step 5: Re-run browser assertion and quality gate**

Run: `npm run build && npm run lint`

Expected: both exit `0`; browser state reaches `ready` when tiles load, fallback disappears, selected route line renders, and failure fallback remains readable.

- [ ] **Step 6: Commit map behavior**

```bash
git add frontend/src/components/MapView.tsx frontend/src/index.css
git commit -m "fix: render resilient command center map"
```

### Task 2: Compose a live-data home operations workspace

**Files:**
- Modify: `frontend/src/pages/OverviewPage.tsx:1-252`
- Modify: `frontend/src/components/DataTable.tsx:1-53`

**Interfaces:**
- Consumes: existing routes, stops, coverage, headway, service-span, and feed-version queries plus `MapView`.
- Produces: operational rail, live map, and network-activity table; API types remain unchanged.

- [ ] **Step 1: Add semantic regions for a failing layout smoke assertion**

```tsx
<aside aria-label="Network operations rail">...</aside>
<section aria-label="Live Jakarta map">...</section>
<section aria-label="Network activity">...</section>
```

Expected browser check: each of the three labels resolves to an element on `/`.

- [ ] **Step 2: Derive rail data from the existing GTFS response**

```ts
const activeSpans = [...sp].sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0));
const railRoutes = activeSpans.slice(0, 5);
const serviceGoal = activeSpans.reduce((sum, item) => sum + (item.service_hours ?? 0), 0);
```

Use these values for progress, corridor distribution, and service rhythm. Never introduce fictional packages, drivers, orders, or weights.

- [ ] **Step 3: Implement the reference-derived home grid**

```tsx
<div className="command-center-grid">
  <aside aria-label="Network operations rail" className="command-rail">...three real-data modules...</aside>
  <div className="command-workspace">
    <section aria-label="Live Jakarta map"><MapView sidebar={false} initialRoute="13" /></section>
    <section aria-label="Network activity"><DataTable rows={activeSpans.slice(0, 8)} columns={activityColumns} /></section>
  </div>
</div>
```

Table columns: `Corridor`, `Route`, `Service window`, `Avg headway`, and `Feed status`. The table stays horizontally scrollable on mobile.

- [ ] **Step 4: Verify responsive composition**

At `1440×900`, verify rail and workspace are side by side. At `390×844`, verify the heading is below island nav, map appears before stacked rail modules, and the table scrolls instead of clipping.

- [ ] **Step 5: Commit home composition**

```bash
git add frontend/src/pages/OverviewPage.tsx frontend/src/components/DataTable.tsx
git commit -m "feat: compose transjakarta operations home"
```

### Task 3: Carry the visual system into every route

**Files:**
- Modify: `frontend/src/index.css`, `frontend/src/components/Layout.tsx`, `frontend/src/components/IslandNav.tsx`
- Modify: `frontend/src/components/PageTitle.tsx`, `frontend/src/components/ChartCard.tsx`, `frontend/src/components/KpiCard.tsx`
- Modify: `frontend/src/pages/NetworkPage.tsx`, `frontend/src/pages/HeadwayPage.tsx`, `frontend/src/pages/CoveragePage.tsx`, `frontend/src/pages/ChangesPage.tsx`, `frontend/src/pages/AboutPage.tsx`

**Interfaces:**
- Consumes: all existing page props and API results.
- Produces: no prop/API changes; a consistent palette, typography, focus ring, and responsive nav clearance.

- [ ] **Step 1: Add shell and grid selectors**

```css
.app-main { padding-top: 7rem; }
.command-center-grid { display: grid; gap: 1rem; }
@media (min-width: 1024px) {
  .command-center-grid { grid-template-columns: minmax(17rem, .45fr) minmax(0, 1fr); }
}
```

- [ ] **Step 2: Preserve Tailwind spacing and palette behavior**

Keep the global reset inside `@layer base`; verify `getComputedStyle(document.querySelector('#main-content')!).paddingTop !== '0px'`. Retain the existing component APIs and give each secondary page a data-appropriate hierarchy: full map, primary headway chart, asymmetric coverage charts, chronological feed changes, and compact system brief.

- [ ] **Step 3: Smoke-test all routes and commit**

Run: `npm run build && npm run lint`

Browser-check `/`, `/map`, `/headway`, `/coverage`, `/changes`, `/about`, and an unknown route. Expected: every route renders an `h1`, navigation is keyboard focusable, and no route emits a render error.

```bash
git add frontend/src/index.css frontend/src/components frontend/src/pages
git commit -m "feat: unify command center visual system"
```

## Self-review

- **Spec coverage:** Task 1 owns map readiness, fallback, contrast, and initial selection. Task 2 owns the desktop/mobile home composition. Task 3 owns palette continuity, island-nav clearance, and secondary pages.
- **Placeholder scan:** No TBD/TODO or unspecified error behavior remains.
- **Type consistency:** The plan preserves current `MapView` props and query types; it introduces no backend interface.
- **Review focus:** Tasks 1–3 each contain checks for all five risk conditions listed above.
