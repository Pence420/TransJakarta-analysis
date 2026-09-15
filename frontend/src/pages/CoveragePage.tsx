import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import { MapPin, Clock } from 'lucide-react';

export default function CoveragePage() {
  const { data: coverageData, isLoading: coverageLoading } = useQuery({
    queryKey: ['coverage'],
    queryFn: () => api.getCoverage(),
  });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['service-span'],
    queryFn: () => api.getServiceSpan(),
  });

  const coverage = Array.isArray(coverageData) ? coverageData : [];
  const serviceSpan = Array.isArray(serviceData) ? serviceData : [];

  const totalStops = coverage.reduce((sum: number, c: Record<string, unknown>) => sum + (c.total_stops as number), 0);
  const totalZones = coverage.length;
  const avgServiceHours = serviceSpan.length > 0
    ? (serviceSpan.reduce((sum: number, s: Record<string, unknown>) => sum + (s.service_hours as number || 0), 0) / serviceSpan.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Coverage & Service</h1>
        <p className="text-sm text-[#6B7280] mt-1">Stop distribution by zone and service span per route</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Stops" value={totalStops} icon={<MapPin size={18} className="text-[#003478]" />} />
        <MetricCard label="Zones Covered" value={totalZones} icon={<MapPin size={18} className="text-[#2E7D32]" />} />
        <MetricCard label="Avg Service Hours" value={`${avgServiceHours}h`} icon={<Clock size={18} className="text-[#E65100]" />} />
      </div>

      {(coverageLoading || serviceLoading) ? (
        <LoadingState message="Loading coverage data..." />
      ) : (
        <>
          {/* Coverage Chart */}
          <ChartCard title="Stops by Zone" subtitle="Distribution of stops across zones">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#003478" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1A73E8" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                  <XAxis dataKey="zone_id" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAED', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`${value} stops`, 'Total']}
                  />
                  <Bar dataKey="total_stops" fill="url(#coverageGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Service Span Chart */}
          {serviceSpan.length > 0 && (
            <ChartCard title="Service Hours by Route" subtitle="Operating hours per route (first to last departure)">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceSpan.slice(0, 15)} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                    <defs>
                      <linearGradient id="serviceGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#E65100" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#FF6D00" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis type="category" dataKey="route_short_name" tick={{ fontSize: 11, fill: '#6B7280' }} width={70} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAED' }}
                      formatter={(value) => [`${value} hours`, 'Service Span']}
                    />
                    <Bar dataKey="service_hours" fill="url(#serviceGradient)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Zone Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {coverage.map((zone: Record<string, unknown>) => (
              <div
                key={zone.zone_id as string}
                className="bg-white rounded-xl p-4 border border-[#E8EAED] hover:shadow-md transition-all duration-200"
              >
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Zone {zone.zone_id as string}</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{zone.total_stops as number}</p>
                <p className="text-xs text-[#6B7280]">stops · {zone.unique_stations as number} stations</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
