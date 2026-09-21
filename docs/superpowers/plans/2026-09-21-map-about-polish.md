# Map And About Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragmented dashboard map with a native interactive Jakarta map, fill the command-rail gap, and turn About into a cohesive product landing page.

**Architecture:** Leaflet owns map tiles, gestures, route geometry, stop markers, and viewport fitting so all geographic layers share one projection. The dashboard keeps its existing data hooks while adding one compact service-window module. About remains a React route but changes from repetitive grids to an editorial hero, proof strip, bento capability story, architecture flow, and principles section.

**Tech Stack:** React, TypeScript, TanStack Query, Leaflet, OpenStreetMap tiles, Vite, CSS.

**Spec:** `docs/superpowers/specs/2026-09-21-geographic-transjakarta-map-design.md`

## Global Constraints

- Preserve the current island navigation.
- Keep the graphite, warm cream, and sage visual language.
- Use real GTFS route geometry and stop coordinates.
- Support mouse wheel, trackpad pinch, touch pinch, drag, and visible zoom controls.
- Do not stage or commit changes.

## Review Focus

- Slow or failed tile requests must leave the map shell usable and readable.
- Switching routes repeatedly must clear old geometry and stop markers.
- Empty route geometry must not crash viewport fitting.
- Small screens must preserve map controls and About reading order.
- Service-window metrics must remain safe when feed-derived values are missing.

---

### Task 1: Native Jakarta Map

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/components/MapView.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `api.getRouteMapData(routeId): Promise<RouteMapDataResponse>`
- Produces: a Leaflet map with route polylines, stop markers, popups, fit bounds, and native zoom gestures.

- [ ] Install `leaflet` and `@types/leaflet`.
- [ ] Replace the fixed raster mosaic and CSS zoom with one Leaflet instance.
- [ ] Render every GTFS direction as a styled polyline and every route stop as a circle marker.
- [ ] Fit valid geometry bounds and keep Jakarta as the empty/default viewport.
- [ ] Verify route switching, wheel/pinch zoom, drag, and zoom controls in the browser.

### Task 2: Command Rail Completion

**Files:**
- Modify: `frontend/src/pages/OverviewPage.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing service-pattern analytics computed by Overview.
- Produces: a compact service-window card below Headway Rhythm.

- [ ] Derive first departure, final departure, and active service span with guarded fallbacks.
- [ ] Add a compact visual module that matches the command rail hierarchy.
- [ ] Verify the rail has no accidental dead zone at dashboard heights.

### Task 3: Editorial About Landing Page

**Files:**
- Modify: `frontend/src/pages/AboutPage.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing route, stop, and feed-version API methods.
- Produces: responsive hero, live proof strip, capability bento, architecture flow, and principles narrative.

- [ ] Replace repetitive equal-card grids with asymmetric editorial sections.
- [ ] Add live network counts with loading-safe fallbacks.
- [ ] Present the data pipeline as a readable product architecture flow.
- [ ] Add responsive rules for tablet and mobile reading order.

### Task 4: Verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: a buildable, lint-clean UI ready for user review.

- [ ] Run `npm run build` in `frontend` and require a successful exit.
- [ ] Run the configured frontend lint command and require no new errors.
- [ ] Inspect Dashboard and About at desktop and narrow widths.
- [ ] Leave all changes uncommitted for the user.
