# Transjakarta command-center redesign

## Intent

Reframe the dashboard as an operations workspace for Transjakarta GTFS data. The home view should borrow the information architecture of the supplied fleet-management reference without copying its logistics data or branding. It must retain the existing floating island navigation.

Success means an operator can immediately see the state of the network, inspect an active corridor on a readable map, and scan the most relevant service data from the first viewport.

## Visual direction

- Deep graphite application canvas with warm-ivory type and muted sage as the positive state/accent.
- One dense but legible desktop workspace, framed by space and dividers rather than excessive nested cards.
- Floating island navigation remains centered at the top on all routes. It is compact on mobile and never overlaps page content.
- The home layout uses a left operational rail and a larger right workspace, modeled on the visual rhythm of the supplied reference.
- Typography uses a clear display face for page and panel titles, a readable sans for body text, and tabular mono for compact data labels.

## Home layout

### Desktop

The home page is a two-column workspace beneath the floating navigation:

1. **Operational rail (about 31%)**
   - A service-progress module that uses real route/service data and shows the current network service window.
   - A corridor distribution module that presents representative BRT/feeder/service metrics using available API data.
   - A service-rhythm module that summarizes headway or service-hour trends.

2. **Main workspace (about 69%)**
   - A large interactive Jakarta map in the first row.
   - A lightweight route search/select control over the map.
   - An active corridor is selected automatically once both the map and routes have loaded.
   - The lower row is a network-activity table: corridor, route/service detail, service window/headway, and live-feed status. It replaces the reference image's order table with Transjakarta data.

### Mobile

- The island nav remains floating and is given dedicated top clearance.
- Map remains the first high-value panel after the compact page heading.
- Operational rail modules stack after the map; the activity table scrolls horizontally when required.

## Map behavior and failure handling

- Replace the existing OpenFreeMap style URL, which has an unreliable sprite/style dependency in this environment, with a self-contained MapLibre style definition backed by CARTO dark raster tiles.
- Use MapLibre's `load` event as the source of truth for map readiness.
- Show the atmospheric fallback only before map readiness or if a map startup failure is detected; it must never sit over a successfully loaded map.
- Draw a dark route casing plus a high-contrast active route line, so route geometry remains visible over the raster tiles.
- Default to the requested route when present; otherwise default to the first available route. This prevents an empty map when route ID `13` is absent from the feed.
- Preserve attribution and existing route-selection behavior.

## Other pages

- **Network map:** full-screen operational map with route directory and the same clear map treatment.
- **Headway analysis:** large primary chart, route filter, key metrics, and a quiet detail table.
- **Coverage:** coverage metrics followed by asymmetrical chart layout and a zone directory.
- **Feed changes:** feed-version comparison controls, concise delta counts, and a chronological activity list.
- **About:** system brief, product capabilities, architecture stack, and principles using the same palette and type hierarchy.

Each route shares the palette and interaction behavior, but gets a layout appropriate to its data instead of inheriting a generic card grid.

## Components and data boundaries

- `MapView` owns map initialization, readiness state, basemap configuration, active route rendering, and route selection.
- `OverviewPage` composes existing API queries into the home rail, primary map, and activity table. It does not own MapLibre setup.
- Shared `ChartCard`, `KpiCard`, `DataTable`, `PageTitle`, `Layout`, and `IslandNav` retain their existing APIs while receiving presentation-only changes.
- No backend endpoint or database schema changes are required. Existing route, headway, coverage, service-span, feed-version, and change APIs remain the source of truth.

## Validation

- Build and lint must pass.
- Desktop and mobile browser checks must confirm navigation clearance and that the map's real basemap is visible once MapLibre loads.
- Map failure state must remain readable if external raster tiles cannot be reached.
- Smoke-check all routes for render errors.
