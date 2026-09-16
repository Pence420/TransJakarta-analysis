import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Route as RouteIcon, ChevronRight } from 'lucide-react';
import MapPanel from '../components/MapPanel';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api/client';

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: routesData, isLoading, error, refetch } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const routes = routesData?.data ?? [];
  const filtered = routes.filter((r) =>
    (r.route_long_name ?? r.route_short_name ?? r.route_id)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
      <div className="w-full lg:w-[55%] xl:w-[60%] relative">
        <MapPanel
          selectedRouteId={selectedRoute}
          onRouteSelect={setSelectedRoute}
          className="w-full h-[400px] lg:h-full"
          routes={routes}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Transjakarta Network</h1>
          <p className="text-sm text-[#64748B]">
            {routesData?.total ?? 0} routes across Jakarta
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Routes"
            value={routesData?.total ?? 0}
            icon={RouteIcon}
            color="#003478"
            index={0}
          />
          <MetricCard
            label="Feed Version"
            value={`v${routes[0]?.feed_version_id ?? 0}`}
            subtext="Latest GTFS"
            icon={RouteIcon}
            color="#1A73E8"
            index={1}
          />
        </div>

        <div className="glass rounded-xl p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search routes..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]
                rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#64748B]
                focus:outline-none focus:border-[#003478] transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading routes..." />
        ) : error ? (
          <ErrorState message="Failed to load routes" onRetry={() => refetch()} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((route, i) => {
                const isSelected = selectedRoute === route.route_id;
                const color = route.route_color
                  ? `#${route.route_color}`
                  : '#003478';

                return (
                  <motion.div
                    key={route.route_id}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all duration-200
                      ${isSelected
                        ? 'glow-blue-subtle border-[rgba(0,52,120,0.4)]'
                        : 'hover:bg-[rgba(30,41,59,0.6)]'
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.5) }}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedRoute(route.route_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg
                          font-bold text-sm text-white shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {route.route_short_name?.slice(0, 3) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {route.route_long_name || route.route_id}
                        </div>
                        <div className="text-xs text-[#64748B] truncate">
                          {route.route_id} · Type {route.route_type}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[#64748B] shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
