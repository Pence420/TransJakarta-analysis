import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2, Route as RouteIcon, Bus } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import type { Route, RouteMapStop } from '../lib/types';

const DEFAULT_COLOR = '#d4c9a8';
const DEFAULT_HEIGHT = 'h-[calc(100dvh-7.5rem)]';
const JAKARTA_CENTER: L.LatLngExpression = [-6.2088, 106.8456];
const MAP_TILE_URL = import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap contributors';

interface Props {
  heightClass?: string;
  sidebar?: boolean;
  initialRoute?: string | null;
}

function safeRouteColor(route?: Route): string {
  return route?.route_color && /^[0-9a-f]{6}$/i.test(route.route_color)
    ? `#${route.route_color}`
    : DEFAULT_COLOR;
}

function isJakartaStop(stop: RouteMapStop): boolean {
  return stop.stop_lon >= 106.3 && stop.stop_lon <= 107.2 && stop.stop_lat >= -6.65 && stop.stop_lat <= -5.9;
}

export default function MapView({ heightClass = DEFAULT_HEIGHT, sidebar = true, initialRoute = null }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapTileError, setMapTileError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(500, 0),
  });
  const routes: Route[] = useMemo(() => data?.data ?? [], [data?.data]);
  const effectiveSelected = selected ?? routes.find((route) => route.route_id === initialRoute)?.route_id ?? routes[0]?.route_id ?? null;
  const mapData = useQuery({
    queryKey: ['route-map-data', effectiveSelected],
    queryFn: () => api.getRouteMapData(effectiveSelected!),
    enabled: Boolean(effectiveSelected),
    staleTime: 60_000,
  });

  const selectedRoute = routes.find((route) => route.route_id === effectiveSelected);
  const visibleStopCount = mapData.data?.stops.filter(isJakartaStop).length ?? 0;
  const filtered = useMemo(
    () => routes.filter((route) =>
      (route.route_long_name ?? route.route_short_name ?? route.route_id)
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    [routes, search],
  );

  const handleSelect = useCallback((route: Route) => setSelected(route.route_id), []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: JAKARTA_CENTER,
      zoom: 11,
      zoomControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 80,
    });

    const tiles = L.tileLayer(MAP_TILE_URL, {
      maxZoom: 19,
      attribution: MAP_TILE_ATTRIBUTION,
      crossOrigin: true,
      keepBuffer: 5,
      updateWhenZooming: false,
    });
    tiles.on('tileerror', () => setMapTileError(true));
    tiles.on('load', () => setMapTileError(false));
    tiles.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = routeLayerRef.current;
    const routeData = mapData.data;
    if (!map || !layerGroup || !mapReady || !routeData) return;

    layerGroup.clearLayers();
    const color = safeRouteColor(selectedRoute);
    const bounds = L.latLngBounds([]);

    routeData.shapes.forEach((shape) => {
      const points = shape.coordinates
        .filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude))
        .map(([longitude, latitude]) => L.latLng(latitude, longitude));
      if (points.length < 2) return;

      points.forEach((point) => bounds.extend(point));
      L.polyline(points, {
        color: '#151916', weight: 10, opacity: 0.72, lineCap: 'round', lineJoin: 'round', interactive: false,
      }).addTo(layerGroup);
      L.polyline(points, {
        color,
        weight: shape.direction_id === 1 ? 4 : 5,
        opacity: shape.direction_id === 1 ? 0.82 : 1,
        dashArray: shape.direction_id === 1 ? '10 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(layerGroup);
    });

    routeData.stops
      .filter(isJakartaStop)
      .forEach((stop) => {
        const point = L.latLng(stop.stop_lat, stop.stop_lon);
        bounds.extend(point);
        const marker = L.circleMarker(point, {
          radius: 4.5, color: '#ffffff', weight: 2, fillColor: '#151916', fillOpacity: 1,
        });
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = stop.stop_name ?? 'Transit stop';
        popup.appendChild(title);
        if (stop.stop_code) {
          const code = document.createElement('span');
          code.textContent = stop.stop_code;
          popup.appendChild(code);
        }
        marker.bindPopup(popup, { offset: [0, -4], closeButton: false });
        marker.addTo(layerGroup);
      });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { paddingTopLeft: [52, 74], paddingBottomRight: [52, 52], maxZoom: 14, animate: true, duration: 0.75 });
    }
  }, [mapData.data, mapReady, selectedRoute]);

  useEffect(() => {
    if (mapData.isError) routeLayerRef.current?.clearLayers();
  }, [mapData.isError]);

  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${sidebar ? 'h-auto min-h-0 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[420px]' : `${heightClass} min-h-[420px]`}`}>
      <div className={`flex-1 rounded-[1.35rem] overflow-hidden glass relative isolate ${sidebar ? 'h-[56dvh] min-h-[420px] lg:h-auto lg:min-h-0' : ''}`}>
        <div ref={containerRef} className="absolute inset-0 z-0 map-canvas" aria-label="Interactive map of Jakarta's Transjakarta network" />
        {!mapReady && (
          <div className="map-atmosphere absolute inset-0 z-[1] pointer-events-none flex items-center justify-center" aria-hidden="true">
            <span className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-muted">Loading Jakarta map</span>
          </div>
        )}

        <div aria-live="polite" className="hidden sm:block absolute top-3 left-3 z-[500] glass-strong rounded-xl px-3 py-2.5 pointer-events-none">
          <p className="panel-label">Network status</p>
          <p className="text-sm font-semibold text-ink mt-0.5">
            {selectedRoute && mapData.isSuccess ? `${selectedRoute.route_short_name ?? selectedRoute.route_id} · ${visibleStopCount} stops` : `${routes.length} corridors`}
          </p>
        </div>

        {sidebar === false && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] glass-strong rounded-xl px-3 py-2 flex items-center gap-2 w-[min(320px,70%)]">
            <RouteIcon size={14} className="text-beige shrink-0" />
            <select
              value={effectiveSelected ?? ''}
              aria-label="Select a Transjakarta corridor"
              onChange={(event) => {
                const route = routes.find((item) => item.route_id === event.target.value);
                if (route) handleSelect(route);
              }}
              className="w-full bg-transparent text-sm font-medium text-ink focus:outline-none truncate"
              title="Select a corridor"
            >
              <option value="">Select a corridor…</option>
              {routes.map((route) => (
                <option key={route.route_id} value={route.route_id}>{route.route_short_name ?? route.route_id} — {route.route_long_name ?? route.route_id}</option>
              ))}
            </select>
          </div>
        )}

        {selectedRoute && sidebar === false && mapData.isSuccess && (
          <div className="absolute bottom-3 left-3 z-[500] glass-strong rounded-xl px-3 py-2 pointer-events-none flex items-center gap-2 max-w-[calc(100%-7rem)]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: safeRouteColor(selectedRoute) }} />
            <span className="text-xs font-medium text-ink truncate">{selectedRoute.route_short_name ?? selectedRoute.route_id} · {visibleStopCount} stops · solid outbound / dashed return</span>
          </div>
        )}

        {mapData.isFetching && (
          <div aria-live="polite" className="absolute bottom-3 right-14 z-[500] glass-strong rounded-lg px-3 py-2 flex items-center gap-2">
            <Loader2 size={13} className="text-beige animate-spin" />
            <span className="text-xs text-ink-muted">Loading route…</span>
          </div>
        )}
        {mapData.isError && <button onClick={() => mapData.refetch()} className="absolute bottom-3 right-14 z-[500] glass-strong rounded-lg px-3 py-2 text-xs text-beige">Retry route data</button>}
        {mapTileError && <p className="absolute top-3 right-3 z-[500] rounded-lg bg-amber/90 px-2.5 py-1.5 text-[10px] font-mono text-graphite">Map tiles are reconnecting…</p>}
      </div>

      {sidebar && (
        <div className="w-full h-[520px] lg:h-auto lg:w-[340px] glass rounded-[1.35rem] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <p className="page-kicker mb-2">Route directory</p>
            <h1 className="text-xl font-semibold text-ink font-display tracking-[-0.035em]">Trace a corridor</h1>
            <p className="text-xs text-ink-muted mt-1 mb-4">Select a route to inspect its real service path.</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
              <input type="search" name="route-search" aria-label="Search Transjakarta routes" autoComplete="off" placeholder="Search routes…" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-black/15 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-beige/40 transition-colors" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {isLoading && <p className="text-sm text-ink-dim text-center py-10">Loading routes…</p>}
            {error && <div className="text-center py-10"><p className="text-sm text-crimson mb-2">Failed to load routes</p><button className="text-xs text-beige hover:underline" onClick={() => refetch()}>Retry</button></div>}
            {!isLoading && !error && filtered.length === 0 && <p className="text-sm text-ink-dim text-center py-10">No routes match “{search}”</p>}
            {filtered.map((route) => {
              const active = effectiveSelected === route.route_id;
              return (
                <button key={route.route_id} onClick={() => handleSelect(route)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-[transform,background-color,border-color] duration-200 hover:translate-x-0.5 ${active ? 'bg-beige/[0.08] border border-beige/25' : 'hover:bg-white/[0.04] border border-transparent'}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-graphite" style={{ backgroundColor: safeRouteColor(route) }}>{route.route_short_name?.slice(0, 3) ?? '?'}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink truncate">{route.route_long_name || route.route_short_name || route.route_id}</p><p className="text-[11px] text-ink-dim truncate font-mono">{route.route_id}</p></div>
                  <ChevronRight size={13} className="text-ink-dim shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/[0.06] flex items-center gap-4 text-[11px] text-ink-dim">
            <span className="flex items-center gap-1.5"><RouteIcon size={12} className="text-beige" /> {routes.length} routes</span>
            <span className="flex items-center gap-1.5"><Bus size={12} className="text-beige/70" /> BRT · Feeder · Non-BRT</span>
          </div>
        </div>
      )}
    </div>
  );
}
