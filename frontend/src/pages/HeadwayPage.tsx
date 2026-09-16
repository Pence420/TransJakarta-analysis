import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Clock, Filter } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import ChartCard from '../components/ChartCard';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api/client';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-medium">Hour {label}</p>
        <p className="text-[#94A3B8]">
          Avg: {payload[0].value} min
        </p>
      </div>
    );
  }
  return null;
};

export default function HeadwayPage() {
  const [routeFilter, setRouteFilter] = useState<string>('');

  const { data: headwayData, isLoading: headwayLoading, error: headwayError, refetch } = useQuery({
    queryKey: ['headway', routeFilter],
    queryFn: () => api.getHeadway(routeFilter || undefined),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes-list'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const headway = headwayData ?? [];
  const routes = routesData?.data ?? [];

  const chartData = headway
    .filter((h) => h.service_hour >= 5 && h.service_hour <= 23)
    .reduce((acc, h) => {
      const existing = acc.find((a) => a.hour === h.service_hour);
      if (existing) {
        existing.avg = Math.round(((existing.avg * existing.count + h.avg_headway_minutes) / (existing.count + 1)) * 10) / 10;
        existing.count++;
      } else {
        acc.push({ hour: h.service_hour, avg: h.avg_headway_minutes, count: 1 });
      }
      return acc;
    }, [] as Array<{ hour: number; avg: number; count: number }>)
    .sort((a, b) => a.hour - b.hour);

  const avgHeadway = headway.length > 0
    ? (headway.reduce((s, h) => s + h.avg_headway_minutes, 0) / headway.length).toFixed(1)
    : '0';

  const tableColumns = [
    { key: 'route_id', label: 'Route' },
    { key: 'route_long_name', label: 'Name', render: (v: unknown) => (
      <span className="truncate max-w-[200px] block">{(v as string) || '-'}</span>
    )},
    { key: 'service_hour', label: 'Hour', render: (v: unknown) => `${v}:00` },
    { key: 'avg_headway_minutes', label: 'Avg (min)', render: (v: unknown) => (
      <span className="font-medium text-white">{v as number}</span>
    )},
    { key: 'min_headway_minutes', label: 'Min' },
    { key: 'max_headway_minutes', label: 'Max' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AnimatedSection>
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Headway Analysis</h1>
          <p className="text-sm text-[#64748B]">Time gaps between consecutive trips per route</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          label="Avg Headway"
          value={`${avgHeadway} min`}
          icon={Clock}
          color="#003478"
          index={0}
        />
        <MetricCard
          label="Routes Tracked"
          value={new Set(headway.map((h) => h.route_id)).size}
          icon={Filter}
          color="#1A73E8"
          index={1}
        />
        <MetricCard
          label="Data Points"
          value={headway.length}
          subtext="route-hour pairs"
          icon={Clock}
          color="#10B981"
          index={2}
        />
      </div>

      <AnimatedSection delay={0.1}>
        <div className="glass rounded-xl p-3">
          <select
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]
              rounded-lg px-4 py-2.5 text-sm text-white
              focus:outline-none focus:border-[#003478] transition-colors"
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
          >
            <option value="">All Routes</option>
            {routes.map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.route_short_name} — {r.route_long_name || r.route_id}
              </option>
            ))}
          </select>
        </div>
      </AnimatedSection>

      {headwayLoading ? (
        <LoadingState message="Loading headway data..." />
      ) : headwayError ? (
        <ErrorState message="Failed to load headway data" onRetry={() => refetch()} />
      ) : (
        <>
          <ChartCard title="Average Headway by Hour" subtitle="Minutes between consecutive trips">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="avg" fill="#003478" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Headway Details" delay={0.2}>
            <DataTable
              columns={tableColumns}
              data={headway.slice(0, 50).map((h) => h as unknown as Record<string, unknown>)}
              emptyMessage="No headway data available"
            />
          </ChartCard>
        </>
      )}
    </div>
  );
}
