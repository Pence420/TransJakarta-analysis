import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../lib/api';
import type { Route } from '../lib/types';

export default function RoutesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const routes: Route[] = data?.data ?? [];
  const filtered = routes.filter((r) =>
    (r.route_long_name ?? r.route_short_name ?? r.route_id)
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = useCallback(async (routeId: string) => {
    setSelected(routeId);
    if (!mapInstance.current) return;
    try {
      const shape = await api.getRouteShape(routeId);
      const src = mapInstance.current.getSource('routes') as maplibregl.GeoJSONSource;
      if (src) {
        src.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { route_color: '#3B82F6' },
            geometry: { type: 'LineString', coordinates: shape.coordinates },
          }],
        });
      }
      const coords = shape.coordinates;
      if (coords.length > 0) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
        );
        mapInstance.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    } catch { /* shape not found */ }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [106.8456, -6.2088],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => {
      map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'routes',
        paint: { 'line-color': ['get', 'route_color'], 'line-width': 3, 'line-opacity': 0.9 },
      });
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100dvh-6rem)] max-w-[1400px] mx-auto">
      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden glass">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h1 className="text-lg font-bold text-white">Transjakarta Network</h1>
          <p className="text-xs text-slate-400 mt-0.5">{routes.length} routes across Jakarta</p>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Routes</p>
              <p className="text-xl font-bold text-white">{routes.length}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Feed</p>
              <p className="text-xl font-bold text-blue-400">v{routes[0]?.feed_version_id ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search routes..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && <p className="text-sm text-slate-500 text-center py-8">Loading routes...</p>}
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-400 mb-2">Failed to load routes</p>
              <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => refetch()}>Retry</button>
            </div>
          )}
          {filtered.map((route) => {
            const active = selected === route.route_id;
            const color = route.route_color ? `#${route.route_color}` : '#3B82F6';
            return (
              <button
                key={route.route_id}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200
                  ${active ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/[0.04] border border-transparent'}`}
                onClick={() => handleSelect(route.route_id)}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {route.route_short_name?.slice(0, 3) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{route.route_long_name || route.route_id}</p>
                  <p className="text-[11px] text-slate-500 truncate">{route.route_id}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
