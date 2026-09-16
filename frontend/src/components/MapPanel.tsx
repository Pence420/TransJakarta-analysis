import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../api/client';
import type { Stop, Route } from '../types';
import LoadingState from './LoadingState';

interface Props {
  selectedRouteId?: string | null;
  onRouteSelect?: (routeId: string) => void;
  className?: string;
  routes?: Route[];
}

const ROUTE_COLORS: Record<number, string> = {
  0: '#10B981',
  1: '#003478',
  2: '#F59E0B',
  3: '#8B5CF6',
  4: '#EF4444',
  5: '#EC4899',
  6: '#06B6D4',
  7: '#F97316',
};

function getRouteColor(routeType: number | null): string {
  return ROUTE_COLORS[routeType ?? 0] ?? '#003478';
}

export default function MapPanel({
  selectedRouteId,
  onRouteSelect,
  className = '',
  routes = [],
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const routeLinesLoaded = useRef(false);

  const loadRouteLines = useCallback(async (mapInstance: maplibregl.Map) => {
    if (routeLinesLoaded.current) return;
    if (!routes.length) return;

    routeLinesLoaded.current = true;

    const geojsonFeatures = await Promise.all(
      routes.slice(0, 50).map(async (route) => {
        try {
          const shape = await api.getRouteShape(route.route_id);
          return {
            type: 'Feature' as const,
            properties: {
              route_id: route.route_id,
              route_name: route.route_long_name || route.route_short_name || route.route_id,
              route_color: getRouteColor(route.route_type),
              route_type: route.route_type,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: shape.coordinates,
            },
          };
        } catch {
          return null;
        }
      })
    );

      const validFeatures = geojsonFeatures.filter(Boolean) as Array<{
        type: 'Feature';
        properties: Record<string, unknown>;
        geometry: { type: 'LineString'; coordinates: [number, number][] };
      }>;

    if (validFeatures.length > 0 && mapInstance.getSource('routes')) {
      (mapInstance.getSource('routes') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: validFeatures,
      });
    }
  }, [routes]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [106.8456, -6.2088],
      zoom: 11,
      pitch: 0,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapInstance.on('load', () => {
      mapInstance.addSource('routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addSource('stops', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'route-lines',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': ['get', 'route_color'],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4,
            2,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            0.6,
          ],
        },
      });

      mapInstance.addLayer({
        id: 'route-lines-glow',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': ['get', 'route_color'],
          'line-width': 6,
          'line-opacity': 0.15,
          'line-blur': 4,
        },
      });

      mapInstance.addLayer({
        id: 'stop-markers',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'hovered'], false],
            8,
            5,
          ],
          'circle-color': '#003478',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      });

      mapInstance.on('mouseenter', 'stop-markers', (e: maplibregl.MapLayerMouseEvent) => {
        if (e.features?.length) {
          mapInstance.setFeatureState(
            { source: 'stops', id: e.features[0].id },
            { hovered: true }
          );
        }
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'stop-markers', (e: maplibregl.MapLayerMouseEvent) => {
        if (e.features?.length) {
          mapInstance.setFeatureState(
            { source: 'stops', id: e.features[0].id },
            { hovered: false }
          );
        }
        mapInstance.getCanvas().style.cursor = '';
      });

      mapInstance.on('click', 'stop-markers', (e: maplibregl.MapLayerMouseEvent) => {
        if (e.features?.length) {
          const props = e.features[0].properties as Record<string, unknown>;
          const coords = (e.features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;

          const stopData: Stop = {
            stop_id: props.stop_id as string,
            stop_name: props.stop_name as string,
            stop_desc: props.stop_desc as string,
            zone_id: props.zone_id as string,
            location_type: props.location_type as number,
            parent_station: props.parent_station as string,
            stop_lat: null,
            stop_lon: null,
            stop_code: null,
            stop_url: null,
            stop_timezone: null,
            wheelchair_boarding: null,
          };

          const popupNode = document.createElement('div');
          popupNode.innerHTML = `
            <div style="min-width:180px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="color:#003478;font-size:14px">📍</span>
                <span style="font-weight:600;color:white;font-size:13px">${stopData.stop_name || 'Unknown'}</span>
              </div>
              <div style="font-size:11px;color:#94A3B8">
                <div>ID: ${stopData.stop_id}</div>
                ${stopData.zone_id ? `<div>Zone: ${stopData.zone_id}</div>` : ''}
                ${stopData.location_type === 1 ? '<div style="color:#10B981">Station</div>' : ''}
              </div>
            </div>
          `;

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({
            offset: 15,
            closeButton: true,
          })
            .setLngLat(coords)
            .setDOMContent(popupNode)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('click', 'route-lines', (e: maplibregl.MapLayerMouseEvent) => {
        if (e.features?.length && onRouteSelect) {
          const routeId = e.features[0].properties?.route_id as string;
          if (routeId) onRouteSelect(routeId);
        }
      });

      mapInstance.on('mouseenter', 'route-lines', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'route-lines', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      map.current = mapInstance;
      setMapReady(true);
      setLoading(false);
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current) return;

    api.getAllStops().then(({ data }) => {
      const features = data
        .filter((s) => s.stop_lat && s.stop_lon)
        .map((stop, i) => ({
          type: 'Feature' as const,
          id: i,
          properties: {
            stop_id: stop.stop_id,
            stop_name: stop.stop_name,
            stop_desc: stop.stop_desc,
            zone_id: stop.zone_id,
            location_type: stop.location_type,
            parent_station: stop.parent_station,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [stop.stop_lon, stop.stop_lat] as [number, number],
          },
        }));

      if (map.current?.getSource('stops')) {
        (map.current.getSource('stops') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features,
        });
      }
    });
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !map.current || !routes.length) return;
    loadRouteLines(map.current);
  }, [mapReady, routes, loadRouteLines]);

  useEffect(() => {
    if (!map.current || !selectedRouteId) return;
    map.current.flyTo({
      center: [106.8456, -6.2088],
      zoom: 13,
      pitch: 30,
      duration: 1500,
      essential: true,
    });
  }, [selectedRouteId]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0E1A]">
          <LoadingState message="Loading map..." />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
}
