import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Clock, Filter } from 'lucide-react';
import { api } from '../lib/api';

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl border border-white/[0.06]">
      <p className="text-slate-400 mb-0.5">Hour {label}</p>
      <p className="text-white font-medium">{payload[0].value} min</p>
    </div>
  );
}

export default function HeadwayPage() {
  const [routeFilter, setRouteFilter] = useState('');

  const { data: headway, isLoading, error, refetch } = useQuery({
    queryKey: ['headway', routeFilter],
    queryFn: () => api.getHeadway(routeFilter || undefined),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes-list'],
    queryFn: () => api.getRoutes(500, 0),
  });

  const data = headway ?? [];
  const routes = routesData?.data ?? [];

  const chartData = data
    .filter((h) => h.service_hour >= 5 && h.service_hour <= 23)
    .reduce((acc, h) => {
      const ex = acc.find((a) => a.hour === h.service_hour);
      if (ex) {
        ex.avg = Math.round(((ex.avg * ex.count + h.avg_headway_minutes) / (ex.count + 1)) * 10) / 10;
        ex.count++;
      } else {
        acc.push({ hour: h.service_hour, avg: h.avg_headway_minutes, count: 1 });
      }
      return acc;
    }, [] as Array<{ hour: number; avg: number; count: number }>)
    .sort((a, b) => a.hour - b.hour);

  const avgHeadway = data.length > 0
    ? (data.reduce((s, h) => s + h.avg_headway_minutes, 0) / data.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Headway Analysis</h1>
        <p className="text-sm text-slate-400 mt-1">Time gaps between consecutive trips per route</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock size={14} className="text-blue-400" />
            </div>
            <span className="text-xs text-slate-400">Avg Headway</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgHeadway}<span className="text-sm text-slate-500 ml-1">min</span></p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Filter size={14} className="text-violet-400" />
            </div>
            <span className="text-xs text-slate-400">Routes Tracked</span>
          </div>
          <p className="text-2xl font-bold text-white">{new Set(data.map((h) => h.route_id)).size}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock size={14} className="text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400">Data Points</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass rounded-xl p-3">
        <select
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
        >
          <option value="">All Routes</option>
          {routes.map((r) => (
            <option key={r.route_id} value={r.route_id}>{r.route_short_name} — {r.route_long_name || r.route_id}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-slate-500 text-center py-12">Loading headway data...</p>}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-400 mb-2">Failed to load headway data</p>
          <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Chart */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Average Headway by Hour</h2>
            <p className="text-xs text-slate-500 mb-4">Minutes between consecutive trips</p>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="avg" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Headway Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Route', 'Name', 'Hour', 'Avg', 'Min', 'Max'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 px-3 py-2 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((h, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2 text-slate-300">{h.route_id}</td>
                      <td className="px-3 py-2 text-white truncate max-w-[180px]">{h.route_long_name || '-'}</td>
                      <td className="px-3 py-2 text-slate-300">{h.service_hour}:00</td>
                      <td className="px-3 py-2 text-white font-medium">{h.avg_headway_minutes}</td>
                      <td className="px-3 py-2 text-slate-300">{h.min_headway_minutes}</td>
                      <td className="px-3 py-2 text-slate-300">{h.max_headway_minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
