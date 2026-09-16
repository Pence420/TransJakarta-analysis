import { MapPin, Route as RouteIcon } from 'lucide-react';
import type { Stop } from '../types';

interface StopPopupProps {
  stop: Stop;
  routes?: string[];
}

export function StopPopup({ stop, routes }: StopPopupProps) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={14} className="text-[#003478]" />
        <span className="font-semibold text-white text-sm">{stop.stop_name}</span>
      </div>
      <div className="space-y-1 text-xs text-[#94A3B8]">
        <div>ID: {stop.stop_id}</div>
        {stop.zone_id && <div>Zone: {stop.zone_id}</div>}
        {stop.location_type === 1 && (
          <div className="text-[#10B981]">Station</div>
        )}
        {routes && routes.length > 0 && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
            <RouteIcon size={12} className="text-[#1A73E8]" />
            <span>{routes.length} route(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface RoutePopupProps {
  routeId: string;
  routeName: string;
  routeColor: string;
}

export function RoutePopup({ routeId, routeName, routeColor }: RoutePopupProps) {
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: routeColor }}
        />
        <span className="font-semibold text-white text-sm">{routeName}</span>
      </div>
      <div className="text-xs text-[#94A3B8]">Route {routeId}</div>
    </div>
  );
}
