import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Filter } from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';
import PageTitle from '../components/PageTitle';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { Spinner, ErrorState } from '../components/LoadingState';
import type { Headway, Route } from '../lib/types';

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-ink-dim mb-0.5">Hour {label}:00</p>
      <p className="text-ink font-semibold">{payload[0].value} min</p>
    </div>
  );
}

export default function HeadwayPage() {
  const [routeFilter, setRouteFilter] = useState('');

  const headway = useQuery({
    queryKey: ['headway', routeFilter],
    queryFn: () => api.getHeadway(routeFilter || undefined),
  });
  const routesData = useQuery({
    queryKey: ['routes-list'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const data = headway.data ?? [];
  const routes: Route[] = routesData.data?.data ?? [];
  const selectedRoute = routes.find((r) => r.route_id === routeFilter);

  const chartData = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    (headway.data ?? [])
      .filter((h) => h.service_hour >= 4 && h.service_hour <= 24)
      .forEach((h) => {
        const cur = buckets.get(h.service_hour) ?? { sum: 0, count: 0 };
        cur.sum += h.avg_headway_minutes;
        cur.count += 1;
        buckets.set(h.service_hour, cur);
      });
return Array.from({ length: 21 }, (_, i) => i + 4).map((hour) => {
  const v = buckets.get(hour);
  return { hour, avg: v ? Math.round((v.sum / v.count) * 10) / 10 : 0 };
});
  }, [headway.data]);

  const avgHeadway = data.length
    ? (data.reduce((s, h) => s + h.avg_headway_minutes, 0) / data.length).toFixed(1)
    : '0';
  const tracked = new Set(data.map((h) => h.route_id)).size;

  if (headway.isLoading || routesData.isLoading) return <Spinner />;
  if (headway.error || routesData.error) return <ErrorState message="Failed to load headway data" onRetry={() => { headway.refetch(); routesData.refetch(); }} />;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Headway Analysis"
        subtitle="Time gaps between consecutive departures across corridors — the heartbeat of the network."
        trailing={
          <div className="glass rounded-xl px-3.5 py-3 min-w-[230px]">
            <div className="flex items-center gap-2 panel-label mb-1.5">
              <Filter size={12} /> Route
            </div>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-ink focus:outline-none"
            >
              <option value="">All corridors</option>
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_short_name ?? r.route_id} — {r.route_long_name || r.route_id}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard item={{ label: 'Avg Headway', value: `${avgHeadway} min`, sub: 'across loaded routes', icon: 'clock' }} />
        <KpiCard item={{ label: 'Routes Tracked', value: String(tracked), sub: routeFilter ? 'corridor in sample' : 'corridors in sample', icon: 'route' }} />
        <KpiCard item={{ label: 'Data Points', value: formatNumber(data.length), sub: 'route-hour pairs', icon: 'activity' }} />
      </div>

      <ChartCard
        title="Average Headway by Hour"
        subtitle={
          selectedRoute
            ? `${selectedRoute.route_short_name ?? selectedRoute.route_id} — ${selectedRoute.route_long_name ?? ''}`
            : 'Network-wide average between 04:00 and midnight'
        }
      >
        <div className="h-[330px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#6f6a63', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}:00`}
                interval={1}
              />
              <YAxis tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(212,201,168,0.06)' }} />
              <Bar dataKey="avg" fill="#d4c9a8" radius={[5, 5, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Headway Details" subtitle="Route-hour level breakdown (first 50)">
        <DataTable<Headway>
          columns={[
            { key: 'route', header: 'Route', render: (h) => <span className="font-mono text-ink">{h.route_id}</span> },
            { key: 'name', header: 'Name', render: (h) => <span className="text-ink truncate max-w-[200px] block">{h.route_long_name ?? '—'}</span> },
            { key: 'hour', header: 'Hour', render: (h) => <span className="text-ink-muted">{h.service_hour}:00</span> },
            { key: 'avg', header: 'Avg (min)', align: 'right', render: (h) => <span className="font-semibold text-ink">{h.avg_headway_minutes}</span> },
            { key: 'min', header: 'Min', align: 'right', render: (h) => <span>{h.min_headway_minutes}</span> },
            { key: 'max', header: 'Max', align: 'right', render: (h) => <span>{h.max_headway_minutes}</span> },
            { key: 'trips', header: 'Trip Pairs', align: 'right', render: (h) => <span>{h.trip_pairs_count}</span> },
          ]}
          rows={data.slice(0, 50)}
          empty={routeFilter ? 'No headway data for this corridor' : 'No headway data'}
        />
      </ChartCard>
    </div>
  );
}
