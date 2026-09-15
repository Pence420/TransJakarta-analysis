import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';

export default function HeadwayPage() {
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  const { data: headwayData, isLoading } = useQuery({
    queryKey: ['headway', selectedRoute],
    queryFn: () => api.getHeadway(selectedRoute || undefined),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes-list'],
    queryFn: () => api.getRoutes(100, 0),
  });

  const data = Array.isArray(headwayData) ? headwayData : [];
  const routes = (routesData as { data?: Record<string, unknown>[] })?.data || [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Headway Analysis</h1>
        <p className="text-sm text-[#6B7280] mt-1">Average time gap between consecutive trips per route per hour</p>
      </div>

      {/* Route Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[#6B7280]">Filter route:</label>
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="px-3 py-2 bg-white border border-[#E8EAED] rounded-xl text-sm focus:outline-none focus:border-[#003478] transition-colors"
        >
          <option value="">All routes</option>
          {routes.map((r: Record<string, unknown>) => (
            <option key={r.route_id as string} value={r.route_id as string}>
              {String(r.route_short_name || r.route_id)} — {String(r.route_long_name || '')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading headway data..." />
      ) : (
        <>
          {/* Headway Chart */}
          <ChartCard title="Headway by Hour" subtitle="Average gap between trips (minutes)">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="headwayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#003478" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1A73E8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis dataKey="service_hour" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAED', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`${value} min`, 'Avg Headway']}
                    labelFormatter={(label) => `Hour: ${label}:00`}
                  />
                  <Bar dataKey="avg_headway_minutes" fill="url(#headwayGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Headway Table */}
          {data.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8EAED] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E8EAED]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Route</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Hour</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Avg (min)</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Min</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 20).map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} className="border-b border-[#E8EAED] last:border-0">
                      <td className="px-4 py-3 font-medium">{String((row.route_short_name as string) || row.route_id)}</td>
                      <td className="px-4 py-3">{String(row.service_hour)}:00</td>
                      <td className="px-4 py-3 font-semibold text-[#003478]">{String(row.avg_headway_minutes)}</td>
                      <td className="px-4 py-3 text-[#2E7D32]">{String(row.min_headway_minutes)}</td>
                      <td className="px-4 py-3 text-[#C62828]">{String(row.max_headway_minutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
