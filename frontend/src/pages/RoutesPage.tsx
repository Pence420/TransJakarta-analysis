import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import MapPanel from '../components/MapPanel';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import { Bus, MapPin } from 'lucide-react';

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const { data: routesData, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(100, 0),
  });

  const routes = (routesData as { data?: Record<string, unknown>[]; total?: number })?.data || [];
  const totalCount = (routesData as { total?: number })?.total || 0;

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Map Panel - Left */}
      <div className="w-[40%] min-w-[320px]">
        <MapPanel
          selectedRouteId={selectedRoute}
          onRouteSelect={setSelectedRoute}
        />
      </div>

      {/* Content Panel - Right */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Transjakarta Routes</h1>
          <p className="text-sm text-[#6B7280] mt-1">{routes.length} routes in current feed</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Total Routes" value={routes.length} icon={<Bus size={18} className="text-[#003478]" />} />
          <MetricCard label="Total Stops" value={totalCount} icon={<MapPin size={18} className="text-[#003478]" />} />
        </div>

        {isLoading ? (
          <LoadingState message="Loading routes..." />
        ) : (
          <div className="grid gap-3">
            {routes.map((route: Record<string, unknown>) => (
              <div
                key={route.route_id as string}
                onClick={() => setSelectedRoute(route.route_id as string)}
                className={`bg-white rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                  selectedRoute === route.route_id
                    ? 'border-[#003478] shadow-lg shadow-[#003478]/10'
                    : 'border-[#E8EAED] hover:border-[#003478]/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: (route.route_color as string) || '#003478' }}
                  >
                    {(route.route_short_name as string)?.slice(0, 3) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A1A2E] truncate">
                      {(route.route_long_name as string) || (route.route_id as string)}
                    </p>
                    <p className="text-xs text-[#6B7280]">ID: {route.route_id as string}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
