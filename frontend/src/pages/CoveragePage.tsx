import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Globe2, MapPin, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';
import PageTitle from '../components/PageTitle';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import { Spinner, ErrorState } from '../components/LoadingState';
import type { Coverage, ServiceSpan } from '../lib/types';

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-ink-dim mb-0.5">{label}</p>
      <p className="text-ink font-semibold">{payload[0].value}</p>
    </div>
  );
}

export default function CoveragePage() {
  const coverage = useQuery({ queryKey: ['coverage'], queryFn: () => api.getCoverage() });
  const spans = useQuery({ queryKey: ['service-span'], queryFn: () => api.getServiceSpan() });

  if (coverage.isLoading || spans.isLoading) return <Spinner />;
  if (coverage.error || spans.error) return <ErrorState message="Failed to load coverage data" onRetry={() => { coverage.refetch(); spans.refetch(); }} />;

  const zones: Coverage[] = coverage.data ?? [];
  const sp: ServiceSpan[] = spans.data ?? [];

  const totalStops = zones.reduce((s, z) => s + z.total_stops, 0);
  const stations = zones.reduce((s, z) => s + z.unique_stations, 0);
  const avgHours = sp.length
    ? (sp.reduce((s, x) => s + (x.service_hours ?? 0), 0) / sp.length).toFixed(1)
    : '0';

  const zoneChart = zones.map((z) => ({ name: z.zone_id || 'ALL', stops: z.total_stops }));
  const serviceChart = [...sp]
    .sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0))
    .slice(0, 20)
    .map((s) => ({ name: s.route_short_name ?? s.route_id, hours: s.service_hours ?? 0 }));

  return (
    <div className="space-y-5">
      <PageTitle
        title="Network Coverage"
        subtitle="Stop distribution, station density, and daily service windows."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard item={{ label: 'Total Stops', value: formatNumber(totalStops), sub: 'point of interest', icon: 'stop' }} />
        <KpiCard item={{ label: 'Stations', value: formatNumber(stations), sub: 'unique station nodes', icon: 'station' }} />
        <KpiCard item={{ label: 'Coverage Zones', value: String(zones.length), sub: 'aggregated zones', icon: 'zone' }} />
        <KpiCard item={{ label: 'Avg Service Hours', value: `${avgHours} h`, sub: 'per corridor', icon: 'clock' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Stops by Zone" subtitle="Distribution across aggregated zones">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneChart} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(212,201,168,0.06)' }} />
                <Bar dataKey="stops" fill="#d4c9a8" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Service Hours by Route" subtitle="Top 20 corridors by daily service window (h)">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceChart} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a6a097', fontSize: 11 }} axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(212,201,168,0.06)' }} />
                <Bar dataKey="hours" fill="#6d9c7b" radius={[0, 4, 4, 0]} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Zone Details" subtitle="Stops and station counts per coverage zone">
        {zones.length === 0 ? (
          <p className="text-sm text-ink-dim text-center py-8">No coverage zones available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((z) => (
              <div key={z.zone_id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:bg-white/[0.04] hover:border-beige/20 transition-colors">
                <div className="flex items-center gap-2 mb-2.5">
                  <MapPin size={13} className="text-beige" />
                  <span className="font-medium text-ink text-sm">{z.zone_id || 'All zones'}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5"><Building2 size={12} className="text-beige/70" /> {formatNumber(z.total_stops)} stops</span>
                  <span className="flex items-center gap-1.5"><Globe2 size={12} className="text-sage" /> {formatNumber(z.unique_stations)} stations</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>


    </div>
  );
}