# Geographic Transjakarta Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render geographically correct Transjakarta routes and stops over a real Jakarta basemap, using the project's GTFS database as the source of truth.

**Architecture:** The FastAPI layer gains one map-specific endpoint that performs the GTFS joins once and returns all unique route shapes plus route-served stops. `MapView` converts that payload into MapLibre GeoJSON sources and layers, fitting the viewport to the actual geometry and keeping tile failures separate from GTFS data failures. The Overview page supplies a data-derived default route only.

**Tech Stack:** Python 3, FastAPI, Psycopg2, PostgreSQL/PostGIS-compatible GTFS schemas, React 19, TypeScript, TanStack Query, MapLibre GL JS, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-21-geographic-transjakarta-map-design.md`

## Global Constraints

- The GTFS database is the sole source of route geometry and route stops; no decorative or fabricated transit paths remain.
- Keep `/api/routes/{route_id}/shape` unchanged for existing consumers; the map uses the new `/map-data` contract.
- Validate route ids with the existing `_validate_id` helper and use parameterized SQL exclusively.
- Keep road-tile provider attribution visible and make the provider configurable for deployment.
- On tile failure, keep real GTFS geometry and stops visible over a neutral canvas; do not replace them with a fake Jakarta drawing.
- Do not stage or commit any implementation changes.

## Review Focus

- A route with two directions must render both shape variants without treating duplicate trips as duplicate lines; covered in Task 2 API test.
- A route with no associated shape must return a useful `404`, not an empty successful response; covered in Task 2 API test.
- Stop coordinates that are null or outside the Jakarta region must not reach a map layer; covered in Task 3 client mapper test.
- A basemap tile outage must not hide GTFS geometry or mislabel the result as a valid road map; covered in Task 4 browser test.
- At mobile width, the route picker, map controls, and stop popup must remain separately reachable; covered in Task 5 browser test.

---

### Task 1: Define the map-data API contract

**Files:**
- Modify: `api/models.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Produces Python models `RouteMapShape`, `RouteMapStop`, and `RouteMapDataResponse`.
- Produces TypeScript interfaces `RouteMapShape`, `RouteMapStop`, and `RouteMapData`.
- Produces `api.getRouteMapData(routeId: string): Promise<RouteMapData>`.

- [ ] **Step 1: Add the failing API contract assertion**

Create `api/tests/test_map_models.py` with a contract fixture:

```python
from api.models import RouteMapDataResponse


def test_route_map_response_keeps_all_shapes_and_stops():
    payload = RouteMapDataResponse.model_validate({
        "route_id": "13",
        "shapes": [{"shape_id": "13-0", "direction_id": 0, "coordinates": [[106.7, -6.2], [106.8, -6.3]]}],
        "stops": [{"stop_id": "TJ001", "stop_code": "001", "stop_name": "Example", "stop_lat": -6.2, "stop_lon": 106.7, "location_type": 0}],
    })
    assert payload.shapes[0].direction_id == 0
    assert payload.stops[0].stop_name == "Example"
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `.venv/bin/python -m pytest api/tests/test_map_models.py -v`

Expected: FAIL because `RouteMapDataResponse` does not exist.

- [ ] **Step 3: Add the minimal Python and TypeScript contracts**

Add these Python definitions to `api/models.py`:

```python
class RouteMapShape(BaseModel):
    shape_id: str
    direction_id: int | None
    coordinates: list[list[float]]


class RouteMapStop(BaseModel):
    stop_id: str
    stop_code: str | None
    stop_name: str | None
    stop_lat: float
    stop_lon: float
    location_type: int | None


class RouteMapDataResponse(BaseModel):
    route_id: str
    shapes: list[RouteMapShape]
    stops: list[RouteMapStop]
```

Mirror those fields in `frontend/src/lib/types.ts`, import `RouteMapData` in
`frontend/src/lib/api.ts`, and add:

```ts
getRouteMapData: (id: string) => fetchJSON<RouteMapData>(`${BASE}/routes/${id}/map-data`),
```

- [ ] **Step 4: Run the contract test and frontend typecheck**

Run: `.venv/bin/python -m pytest api/tests/test_map_models.py -v && npm run build`

Expected: PASS; TypeScript accepts the matching API client contract.

### Task 2: Serve all GTFS shapes and route-served stops

**Files:**
- Modify: `api/routes.py`
- Modify: `api/models.py`
- Modify: `api/tests/test_map_data_route.py`

**Interfaces:**
- Consumes `RouteMapDataResponse` from Task 1 and an already validated `route_id`.
- Produces `GET /api/routes/{route_id}/map-data`.

- [ ] **Step 1: Write API behavior tests with a cursor fixture**

Create `api/tests/test_map_data_route.py` that monkeypatches `get_db` with a
cursor fixture returning two unique shapes and two unique stops. Assert that a
request to `/api/routes/13/map-data` returns both directions and that repeated
trips do not duplicate a shape or a stop. Add a second fixture where the shapes
query returns no rows and assert `404` with `No shape found for this route`.

```python
def test_map_data_returns_unique_shapes_and_route_stops(client, fake_db):
    response = client.get("/api/routes/13/map-data")
    assert response.status_code == 200
    assert [shape["shape_id"] for shape in response.json()["shapes"]] == ["13-0", "13-1"]
    assert [stop["stop_id"] for stop in response.json()["stops"]] == ["TJ001", "TJ002"]
```

- [ ] **Step 2: Run the route API tests to verify they fail**

Run: `.venv/bin/python -m pytest api/tests/test_map_data_route.py -v`

Expected: FAIL with `404` because the endpoint does not exist.

- [ ] **Step 3: Implement the endpoint with deterministic GTFS queries**

Import `RouteMapDataResponse` in `api/routes.py` and add the route handler
before the existing single-shape endpoint. Query shapes through the active
route trips, preserving direction:

```sql
SELECT ft.shape_id, ft.direction_id, s.shape_pt_lon, s.shape_pt_lat
FROM (
  SELECT DISTINCT shape_id, direction_id
  FROM marts.fact_trip
  WHERE route_id = %s AND shape_id IS NOT NULL
) ft
JOIN staging.shapes s ON s.shape_id = ft.shape_id
ORDER BY ft.direction_id NULLS LAST, ft.shape_id, s.shape_pt_sequence
```

Group adjacent rows by `(shape_id, direction_id)` into the response's shape
objects. Then query distinct stops served by any route trip:

```sql
SELECT DISTINCT ON (ds.stop_id)
  ds.stop_id, ds.stop_code, ds.stop_name, ds.stop_lat, ds.stop_lon, ds.location_type
FROM marts.fact_trip ft
JOIN staging.stop_times st ON st.trip_id = ft.trip_id AND st.feed_version_id = ft.feed_version_id
JOIN marts.dim_stop ds ON ds.stop_id = st.stop_id
WHERE ft.route_id = %s
  AND ds.stop_lat IS NOT NULL
  AND ds.stop_lon IS NOT NULL
ORDER BY ds.stop_id, ds.stop_name NULLS LAST
```

Return `404` when no grouped shape has at least two coordinates. Keep all SQL
parameters as `(route_id,)` and retain existing rate limiting.

- [ ] **Step 4: Run API tests and the real endpoint smoke check**

Run: `.venv/bin/python -m pytest api/tests/test_map_data_route.py api/tests/test_map_models.py -v`

Then, with the local API running:

```bash
curl -fsS http://127.0.0.1:8000/api/routes/13/map-data
```

Expected: tests PASS; response contains more than one coordinate for every
shape and actual stop coordinates around Jakarta.

### Task 3: Convert one map-data response into MapLibre layers

**Files:**
- Create: `frontend/src/lib/mapGeoJson.ts`
- Create: `frontend/src/lib/mapGeoJson.test.ts`
- Modify: `frontend/src/components/MapView.tsx`

**Interfaces:**
- Consumes `RouteMapData` from Task 1.
- Produces `toRouteFeatureCollection(data: RouteMapData)` and
  `toStopFeatureCollection(data: RouteMapData)`.
- `MapView` uses `api.getRouteMapData(routeId)` instead of `getRouteShape`.

- [ ] **Step 1: Write client mapper tests**

Create `frontend/src/lib/mapGeoJson.test.ts` with one route having shape
directions 0 and 1 plus one invalid stop coordinate. Assert that the route
mapper outputs two LineString features with their direction properties and the
stop mapper discards the invalid coordinate.

```ts
expect(toRouteFeatureCollection(data).features).toHaveLength(2)
expect(toRouteFeatureCollection(data).features[1].properties?.direction_id).toBe(1)
expect(toStopFeatureCollection(data).features).toHaveLength(1)
```

- [ ] **Step 2: Run the mapper test to verify it fails**

Run: `npm test -- mapGeoJson.test.ts`

Expected: FAIL because the mapper module and test runner are absent.

- [ ] **Step 3: Add a minimal Vitest test command and implement pure mappers**

Install `vitest` as a development dependency only. Add the script
`"test": "vitest run"` to `frontend/package.json`. Implement each mapper as a
pure function using GeoJSON `FeatureCollection` values; reject points outside
longitude `106.3–107.2` or latitude `-6.65–-5.9`.

- [ ] **Step 4: Replace the MapView single-shape flow**

In `MapView.tsx`, remove the decorative `map-fallback` SVG and the all-network
stops fetch. Add React Query for `['route-map-data', selectedRouteId]`, update
the `route-shapes` and `route-stops` sources on success, and calculate a
`LngLatBounds` from every shape coordinate. Register these layers once on map
load:

```ts
map.addLayer({ id: 'route-casing', type: 'line', source: 'route-shapes', paint: { 'line-color': '#101311', 'line-width': 9 } })
map.addLayer({ id: 'route-primary', type: 'line', source: 'route-shapes', filter: ['==', ['get', 'direction_id'], 0], paint: { 'line-color': ['get', 'route_color'], 'line-width': 5 } })
map.addLayer({ id: 'route-return', type: 'line', source: 'route-shapes', filter: ['==', ['get', 'direction_id'], 1], paint: { 'line-color': ['get', 'route_color'], 'line-width': 4, 'line-dasharray': [2, 1.5], 'line-opacity': 0.78 } })
```

Add `stop-halo` and `stop-marker` circle layers above the route layers.

- [ ] **Step 5: Run frontend tests and build**

Run: `npm test -- mapGeoJson.test.ts && npm run lint && npm run build`

Expected: all commands PASS.

### Task 4: Make map states and interactions honest

**Files:**
- Modify: `frontend/src/components/MapView.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes populated GeoJSON sources from Task 3.
- Produces selectable routes, a stop popup, map status state, and an attributed
  road basemap that degrades without fabricated geometry.

- [ ] **Step 1: Add a failing browser acceptance script**

Create `frontend/scripts/check-map.mjs` using Playwright. It must start from
the Overview page, select route `13`, wait for `route-primary` canvas content,
click a `stop-marker`, and assert a popup contains a real stop name. Add a
second test path that aborts tile requests and asserts text `Road map is
unavailable; showing GTFS geometry.` appears while the route selector and
route legend remain visible.

- [ ] **Step 2: Run the browser check to verify it fails**

Run: `node frontend/scripts/check-map.mjs`

Expected: FAIL because the map does not yet expose the required layers, popup,
or tile-unavailable state.

- [ ] **Step 3: Implement basemap and failure state**

Use a MapLibre style with an attributed, configurable raster tile URL. Track
tile errors separately from route-data errors. Keep the neutral background
style layer available from map initialization; when tile errors occur, show the
following non-interactive chip above the map:

```tsx
<p className="map-status map-status-warning">Road map is unavailable; showing GTFS geometry.</p>
```

Do not add any local SVG road, river, route, or stop substitute. Add an
environment-backed frontend constant for the tile URL with the existing Carto
URL only as a development default and preserve MapLibre attribution.

- [ ] **Step 4: Implement selector, legend, stop popup, and retry**

Make the selector's accessible label `Select a corridor`. After map data is
ready, render a legend such as `13 · 42 stops · solid outbound / dashed return`.
Register a click handler for `stop-marker` that reads the GeoJSON properties
and opens a `maplibregl.Popup` with escaped stop name and optional stop code.
Route-data errors display a `Retry route data` button that calls the matching
React Query refetch function.

- [ ] **Step 5: Run browser acceptance and build checks**

Run: `node frontend/scripts/check-map.mjs && cd frontend && npm run lint && npm run build`

Expected: the browser script proves geometry and a real stop popup remain
available during a forced tile outage; lint and build PASS.

### Task 5: Integrate the geographic map into the dashboard and verify mobile

**Files:**
- Modify: `frontend/src/pages/OverviewPage.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/scripts/check-map.mjs`

**Interfaces:**
- Consumes `MapView` with an optional `initialRoute` string.
- Produces a data-derived Overview default and responsive control placement.

- [ ] **Step 1: Add the mobile acceptance assertion**

Extend `frontend/scripts/check-map.mjs` to set a `390 × 844` viewport and
assert that the selector, legend, and zoom-in control bounding boxes do not
overlap. The assertion must compare all three box pairs.

```js
assert(!overlaps(selectorBox, legendBox))
assert(!overlaps(selectorBox, zoomBox))
assert(!overlaps(legendBox, zoomBox))
```

- [ ] **Step 2: Run the mobile assertion to verify it fails**

Run: `node frontend/scripts/check-map.mjs`

Expected: FAIL until responsive map control placement is implemented.

- [ ] **Step 3: Remove old map-specific presentation and wire default route**

Keep Overview's default route as `topRoutes[0]?.route_id ?? null`. Remove CSS
for `.map-fallback`, its SVG paths, and its label. Add responsive CSS so the
selector occupies the top edge, MapLibre navigation controls use the opposite
top corner, and the legend uses the lower edge on desktop then flows below the
selector on mobile.

- [ ] **Step 4: Run full verification**

Run: `.venv/bin/python -m pytest api/tests -v && cd frontend && npm test && npm run lint && npm run build && node scripts/check-map.mjs`

Expected: API, mapper, browser, lint, and production build checks PASS.

### Task 6: Update API documentation

**Files:**
- Modify: `docs/06a-api-layer.md`

**Interfaces:**
- Consumes the final `/api/routes/{route_id}/map-data` contract from Task 2.
- Produces accurate API endpoint documentation for future frontend consumers.

- [ ] **Step 1: Add the endpoint row and behavior description**

Add this routes table row:

```markdown
| GET | `/api/routes/{route_id}/map-data` | Semua shape arah dan halte yang dilayani oleh satu route, untuk map geografis |
```

Below the table, document that it returns unique GTFS shapes and served stops,
uses the active feed, and returns `404` when the route has no valid geometry.

- [ ] **Step 2: Verify the documented request**

Run: `curl -fsS http://127.0.0.1:8000/api/routes/13/map-data`

Expected: JSON response matches the documented `route_id`, `shapes`, and
`stops` fields.
