import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapPin, Globe, Clock } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import ChartCard from '../components/ChartCard';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api/client';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-medium">{label}</p>
        <p className="text-[#94A3B8]">{payload[0].value} stops</p>
      </div>
    );
  }
  return null;
};

export default function CoveragePage() {
  const { data: coverage, isLoading, error, refetch } = useQuery({
    queryKey: ['coverage'],
    queryFn: () => api.getCoverage(),
  });

  const { data: serviceSpan } = useQuery({
    queryKey: ['service-span'],
    queryFn: () => api.getServiceSpan(),
  });

  const zones = coverage ?? [];
  const spans = serviceSpan ?? [];

  const totalStops = zones.reduce((s, z) => s + z.total_stops, 0);
  const avgServiceHours = spans.length > 0
    ? (spans.reduce((s, sp) => s + (sp.service_hours ?? 0), 0) / spans.length).toFixed(1)
    : '0';

  const zoneChartData = zones.map((z) => ({
    name: z.zone_id || 'Unknown',
    stops: z.total_stops,
    stations: z.unique_stations,
  }));

  const serviceChartData = spans
    .sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0))
    .slice(0, 20)
    .map((s) => ({
      name: s.route_short_name || s.route_id,
      hours: s.service_hours ?? 0,
    }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AnimatedSection>
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Network Coverage</h1>
          <p className="text-sm text-[#64748B]">Stop distribution and service hours across zones</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          label="Total Stops"
          value={totalStops.toLocaleString()}
          icon={MapPin}
          color="#003478"
          index={0}
        />
        <MetricCard
          label="Zones Covered"
          value={zones.length}
          icon={Globe}
          color="#1A73E8"
          index={1}
        />
        <MetricCard
          label="Avg Service Hours"
          value={`${avgServiceHours}h`}
          subtext="per route"
          icon={Clock}
          color="#10B981"
          index={2}
        />
      </div>

      {isLoading ? (
        <LoadingState message="Loading coverage data..." />
      ) : error ? (
        <ErrorState message="Failed to load coverage data" onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Stops by Zone" subtitle="Distribution across zones">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneChartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="stops" fill="#003478" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Service Hours by Route" subtitle="Top 20 longest service windows">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceChartData} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(17,24,39,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#F1F5F9',
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="hours" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <AnimatedSection delay={0.2}>
            <ChartCard title="Zone Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {zones.map((zone, i) => (
                  <AnimatedSection key={zone.zone_id} delay={i * 0.05}>
                    <div className="glass rounded-xl p-4 hover:bg-[rgba(30,41,59,0.6)] transition-all duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-[#003478]" />
                        <span className="font-medium text-white text-sm">
                          {zone.zone_id || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-[#64748B]">
                        <span>{zone.total_stops} stops</span>
                        <span>{zone.unique_stations} stations</span>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </ChartCard>
          </AnimatedSection>
        </>
      )}
    </div>
  );
}
