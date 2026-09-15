import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPanelProps {
  selectedRouteId?: string | null;
  onRouteSelect?: (routeId: string) => void;
}

export default function MapPanel({ selectedRouteId }: MapPanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [106.8456, -6.2088],
      zoom: 11,
      pitch: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add route source
      map.current!.addSource('routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'route-lines',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': '#94A3B8',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });

      // Add stops source
      map.current!.addSource('stops', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'stop-markers',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 5,
          'circle-color': '#003478',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2,
        },
      });

      // Load stops data
      fetchStops();
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const fetchStops = async () => {
    try {
      const res = await fetch('/api/stops?limit=1000');
      const data = await res.json();
      const features = data.data
        .filter((s: { stop_lat: number | null; stop_lon: number | null }) => s.stop_lat && s.stop_lon)
        .map((s: { stop_id: string; stop_name: string | null; stop_lat: number; stop_lon: number }) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [s.stop_lon, s.stop_lat] },
          properties: { stop_id: s.stop_id, stop_name: s.stop_name },
        }));

      const source = map.current?.getSource('stops');
      if (source && 'setData' in source) {
        (source as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features,
        });
      }
    } catch (err) {
      console.error('Failed to load stops:', err);
    }
  };

  // Update route highlight when selectedRouteId changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (selectedRouteId) {
      map.current.setPaintProperty('route-lines', 'line-color', '#003478');
    } else {
      map.current.setPaintProperty('route-lines', 'line-color', '#94A3B8');
    }
  }, [selectedRouteId, mapLoaded]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#E8EAED] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FA]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#003478] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#6B7280]">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
