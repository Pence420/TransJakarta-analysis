import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapPin, Globe, Clock } from 'lucide-react';
import { api } from '../lib/api';

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl border border-white/[0.06]">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="text-white font-medium">{payload[0].value}</p>
    </div>
  );
}

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
  const avgHours = spans.length > 0
    ? (spans.reduce((s, sp) => s + (sp.service_hours ?? 0), 0) / spans.length).toFixed(1)
    : '0';

  const zoneChart = zones.map((z) => ({ name: z.zone_id || 'Unknown', stops: z.total_stops }));
  const serviceChart = spans
    .sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0))
    .slice(0, 20)
    .map((s) => ({ name: s.route_short_name || s.route_id, hours: s.service_hours ?? 0 }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Network Coverage</h1>
        <p className="text-sm text-slate-400 mt-1">Stop distribution and service hours across zones</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <MapPin size={14} className="text-blue-400" />
            </div>
            <span className="text-xs text-slate-400">Total Stops</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalStops.toLocaleString()}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Globe size={14} className="text-violet-400" />
            </div>
            <span className="text-xs text-slate-400">Zones Covered</span>
          </div>
          <p className="text-2xl font-bold text-white">{zones.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock size={14} className="text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400">Avg Service Hours</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgHours}<span className="text-sm text-slate-500 ml-1">h</span></p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500 text-center py-12">Loading coverage data...</p>}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-400 mb-2">Failed to load coverage data</p>
          <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">Stops by Zone</h2>
              <p className="text-xs text-slate-500 mb-4">Distribution across zones</p>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneChart} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="stops" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">Service Hours by Route</h2>
              <p className="text-xs text-slate-500 mb-4">Top 20 longest service windows</p>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceChart} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="hours" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Zone Details */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Zone Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {zones.map((z) => (
                <div key={z.zone_id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={13} className="text-blue-400" />
                    <span className="font-medium text-white text-sm">{z.zone_id}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{z.total_stops} stops</span>
                    <span>{z.unique_stations} stations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
