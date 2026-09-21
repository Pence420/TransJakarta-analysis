# Geographic Transjakarta Map Design

## Goal

Replace the current decorative fallback map with an operational map of Jakarta.
The map must show a real Jakarta road basemap and use coordinates from the
project's GTFS database for every selected Transjakarta route and stop. It is a
static GTFS operations map, not a live vehicle tracker.

## What success means

- Selecting route `13` traces its actual GTFS shape around Jakarta rather than
  a decorative line.
- Every direction or shape variant available for that route is drawn, with a
  clear direction-aware visual treatment.
- Only stops served by the selected route are shown. Clicking one opens its
  name and stop code.
- The map automatically fits the selected route's geographic bounds without
  clipping the line beneath interface controls.
- The page remains usable on mobile: selector, legend, popup, and map controls
  do not cover one another.
- If the road basemap cannot load, the app says so explicitly while still
  drawing the real GTFS route and stops on a neutral geographic canvas. It
  must never substitute a fabricated route illustration.

## Data contract

### New endpoint

`GET /api/routes/{route_id}/map-data`

The response is intentionally map-specific so the frontend does not need to
join trips, shapes, stop times, and stops in the browser.

```json
{
  "route_id": "13",
  "shapes": [
    {
      "shape_id": "13-0",
      "direction_id": 0,
      "coordinates": [[106.7, -6.2], [106.71, -6.21]]
    }
  ],
  "stops": [
    {
      "stop_id": "...",
      "stop_code": "...",
      "stop_name": "...",
      "stop_lat": -6.2,
      "stop_lon": 106.7,
      "location_type": 0
    }
  ]
}
```

The endpoint queries the active GTFS feed through `marts.fact_trip`,
`staging.shapes`, `raw.stop_times`, and `marts.dim_stop`. It returns unique
shapes and unique stops, sorted deterministically by direction, shape, and stop
name. Invalid route ids preserve the existing API validation rules; routes
without geometry return `404` with a clear message.

The existing `/shape` endpoint remains for compatibility, but the map UI stops
using it because its `LIMIT 1` query cannot faithfully represent a route.

## Map rendering

Leaflet renders a Jakarta road basemap. The renderer receives route shapes and
stops from the map-specific API response:

- Each shape becomes a native Leaflet polyline with its `direction_id` and
  `shape_id`. A dark casing keeps the route legible over roads;
  direction 0 uses the route color and direction 1 uses the same color with a
  dashed or reduced-opacity treatment.
- Each stop becomes a native Leaflet circle marker with a high-contrast outline
  and a clickable popup.

The default camera is Jakarta. After a route is selected, `fitBounds` uses all
coordinates returned in `map-data`, with responsive padding. The selected route
is preloaded on Overview using the longest active corridor, not a hard-coded
route id.

Road tiles are an enhancement and require visible OpenStreetMap attribution.
OpenStreetMap's public tile service has no SLA and has a usage policy, so the
implementation uses it only for development-scale traffic and makes the tile
provider configurable for deployment. The GTFS geometry is never dependent on
tiles: a map-tile error leaves an honest muted geographic background and still
renders the selected route and stops.

## Interaction and visual rules

- A compact searchable route selector lives at the top of the map.
- A contextual legend appears only after route geometry loads; it identifies
  the selected corridor, direction treatment, and displayed stop count.
- Clicking a stop opens a Leaflet popup with stop name and optional stop code.
- Shape/stops loading uses an inline map status chip. Route requests can be
  retried without reloading the page.
- The current hand-drawn SVG `map-fallback` is removed. No fake map roads,
  route paths, or stop positions remain.
- The light map surface follows the approved reference composition; surrounding
  dashboard surfaces keep the graphite, beige, and sage palette.

## Component boundaries

- `api/models.py`: typed Pydantic models for map shapes, stops, and the map
  response.
- `api/routes.py`: one database query boundary for `map-data`.
- `frontend/src/lib/types.ts` and `api.ts`: matching client contract.
- `frontend/src/components/MapView.tsx`: owns Leaflet lifecycle, layer
  updates, selector, popup, and tile/route error state. It contains no SQL or
  dashboard metric calculations.
- `frontend/src/pages/OverviewPage.tsx`: selects the default route using the
  service-span data it already owns; it does not transform map geometry.
- `frontend/src/index.css`: only map presentation tokens and responsive
  placement, not route data or map behavior.

## Verification

1. API test: route `13` returns at least one valid LineString and stops with
   Jakarta longitude/latitude ranges.
2. API test: a Mikrotrans route returns a separate valid data set.
3. Browser check: changing the selector changes route geometry, stop count,
   legend text, and fitted viewport.
4. Browser check: clicking a stop opens its real name.
5. Browser check: mobile viewport shows no overlapping map controls.
6. `npm run lint`, `npm run build`, and backend tests relevant to routes pass.

## Non-goals

- Real-time bus positions, ETAs, or traffic overlays. Those require a GTFS-RT
  or AVL source which this project does not currently ingest.
- A guaranteed commercial map-tile SLA. Deployment can configure a tile
  provider later without changing the GTFS map-data contract.
