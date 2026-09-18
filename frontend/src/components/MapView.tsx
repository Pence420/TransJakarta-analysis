import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2, Route as RouteIcon, Bus } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../lib/api';
import type { Route } from '../lib/types';

const DEFAULT_COLOR = '#d4c9a8';
const DEFAULT_HEIGHT = 'h-[calc(100dvh-7.5rem)]';
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

interface Props {
  heightClass?: string;
  sidebar?: boolean;
  initialRoute?: string | null;
}

export default function MapView({ heightClass = DEFAULT_HEIGHT, sidebar = true, initialRoute = null }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loadingShape, setLoadingShape] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const routesRef = useRef<Route[]>([]);
  const autoStarted = useRef(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const routes: Route[] = data?.data ?? [];
  useEffect(() => {
    routesRef.current = data?.data ?? [];
  }, [data]);

  const filtered = routes.filter((r) =>
    (r.route_long_name ?? r.route_short_name ?? r.route_id)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const drawShape = useCallback(async (routeId: string, color: string) => {
    const map = mapRef.current;
    if (!map) return;
    setLoadingShape(true);
    try {
      const shape = await api.getRouteShape(routeId);
      const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { route_color: color },
              geometry: { type: 'LineString', coordinates: shape.coordinates },
            },
          ],
        });
      }
      const coords = shape.coordinates;
      if (coords.length > 0) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
        );
        map.fitBounds(bounds, { padding: 64, maxZoom: 13.5, duration: 900 });
      }
    } catch {
      const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
      src?.setData({ type: 'FeatureCollection', features: [] });
    } finally {
      setLoadingShape(false);
    }
  }, []);

  const handleSelect = useCallback(
    (route: Route) => {
      setSelected(route.route_id);
      const color = route.route_color ? `#${route.route_color}` : DEFAULT_COLOR;
      void drawShape(route.route_id, color);
    },
    [drawShape],
  );

  // Auto-draw a corridor once the map + routes are ready (dashboard centerpiece).
  useEffect(() => {
    if (!initialRoute || autoStarted.current) return;
    const id = setInterval(() => {
      const map = mapRef.current;
      const rt = routesRef.current.find((r) => r.route_id === initialRoute);
      if (map && map.getSource('route') && rt) {
        clearInterval(id);
        autoStarted.current = true;
        setSelected(rt.route_id);
        const color = rt.route_color ? `#${rt.route_color}` : DEFAULT_COLOR;
        void drawShape(rt.route_id, color);
      }
    }, 250);
    return () => clearInterval(id);
  }, [initialRoute, drawShape]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [106.8456, -6.2088],
      zoom: 10.8,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': ['get', 'route_color'],
          'line-width': 3.5,
          'line-opacity': 0.95,
        },
      });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const selectedRoute = routes.find((r) => r.route_id === selected);

  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${heightClass} min-h-[420px]`}>
      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden glass relative">
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Network badge */}
        <div className="absolute top-3 left-3 z-10 glass-strong rounded-xl px-3 py-2 pointer-events-none">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">Network</p>
          <p className="text-sm font-medium text-ink">{routes.length} routes across Jakarta</p>
        </div>

        {sidebar === false && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 glass-strong rounded-xl px-3 py-2 flex items-center gap-2 w-[min(300px,70%)]">
            <RouteIcon size={14} className="text-beige shrink-0" />
            <select
              value={selected ?? ''}
              onChange={(e) => {
                const r = routes.find((x) => x.route_id === e.target.value);
                if (r) handleSelect(r);
              }}
              className="w-full bg-transparent text-sm text-ink focus:outline-none truncate"
              title="Select a corridor"
            >
              <option value="">Select a corridor…</option>
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_short_name ?? r.route_id} — {r.route_long_name ?? r.route_id}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRoute && sidebar === false && (
          <div className="absolute bottom-3 left-3 z-10 glass-strong rounded-xl px-3 py-2 pointer-events-none flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedRoute.route_color ? `#${selectedRoute.route_color}` : DEFAULT_COLOR }}
            />
            <span className="text-xs text-ink">
              {selectedRoute.route_short_name ?? selectedRoute.route_id} —{' '}
              {selectedRoute.route_long_name ?? selectedRoute.route_id}
            </span>
          </div>
        )}

        {loadingShape && (
          <div className="absolute bottom-3 right-3 z-10 glass-strong rounded-lg px-3 py-2 flex items-center gap-2">
            <Loader2 size={13} className="text-beige animate-spin" />
            <span className="text-xs text-ink-muted">Loading route shape…</span>
          </div>
        )}
      </div>

      {/* Sidebar route list */}
      {sidebar && (
        <div className="w-full lg:w-[320px] glass rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h1 className="text-lg font-semibold text-ink font-display">Routes</h1>
            <p className="text-xs text-ink-muted mt-0.5 mb-3">Select a route to trace its corridor</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
              <input
                type="text"
                placeholder="Search routes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-beige/40 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && (
              <p className="text-sm text-ink-dim text-center py-10">Loading routes…</p>
            )}
            {error && (
              <div className="text-center py-10">
                <p className="text-sm text-crimson mb-2">Failed to load routes</p>
                <button className="text-xs text-beige hover:underline" onClick={() => refetch()}>
                  Retry
                </button>
              </div>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <p className="text-sm text-ink-dim text-center py-10">No routes match “{search}”</p>
            )}
            {filtered.map((route) => {
              const active = selected === route.route_id;
              const color = route.route_color ? `#${route.route_color}` : DEFAULT_COLOR;
              return (
                <button
                  key={route.route_id}
                  onClick={() => handleSelect(route)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 ${
                    active
                      ? 'bg-beige/[0.08] border border-beige/25'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-graphite"
                    style={{ backgroundColor: color }}
                  >
                    {route.route_short_name?.slice(0, 3) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {route.route_long_name || route.route_short_name || route.route_id}
                    </p>
                    <p className="text-[11px] text-ink-dim truncate font-mono">{route.route_id}</p>
                  </div>
                  <ChevronRight size={13} className="text-ink-dim shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/[0.06] flex items-center gap-4 text-[11px] text-ink-dim">
            <span className="flex items-center gap-1.5">
              <RouteIcon size={12} className="text-beige" /> {routes.length} routes
            </span>
            <span className="flex items-center gap-1.5">
              <Bus size={12} className="text-beige/70" /> BRT · Feeder · Non-BRT
            </span>
          </div>
        </div>
      )}
    </div>
  );
}