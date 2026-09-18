import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { GitBranch, Rss, CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber, fmtDate, fmtBytes } from '../lib/format';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import MapView from '../components/MapView';
import { Spinner, ErrorState } from '../components/LoadingState';

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-ink-dim mb-0.5">{label}</p>
      <p className="text-ink font-semibold">{payload[0].value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const routes = useQuery({ queryKey: ['routes-count'], queryFn: () => api.getRoutes(1, 0) });
  const stops = useQuery({ queryKey: ['stops-count'], queryFn: () => api.getStops(1, 0) });
  const coverage = useQuery({ queryKey: ['coverage'], queryFn: () => api.getCoverage() });
  const headway = useQuery({ queryKey: ['headway'], queryFn: () => api.getHeadway() });
  const spans = useQuery({ queryKey: ['service-span'], queryFn: () => api.getServiceSpan() });
  const versions = useQuery({ queryKey: ['feed-versions'], queryFn: () => api.getFeedVersions() });

  const loading = routes.isLoading || stops.isLoading || coverage.isLoading || headway.isLoading || spans.isLoading || versions.isLoading;
  const error = routes.error || stops.error || coverage.error || headway.error || spans.error || versions.error;

  const hw = headway.data ?? [];
  const sp = spans.data ?? [];

  const headwayChart = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    (headway.data ?? [])
      .filter((h) => h.service_hour >= 4 && h.service_hour <= 24)
      .forEach((h) => {
        const cur = buckets.get(h.service_hour) ?? { sum: 0, count: 0 };
        cur.sum += h.avg_headway_minutes;
        cur.count += 1;
        buckets.set(h.service_hour, cur);
      });
    return [...buckets.entries()]
      .map(([hour, v]) => ({ hour, avg: Math.round((v.sum / v.count) * 10) / 10 }))
      .sort((a, b) => a.hour - b.hour);
  }, [headway.data]);

  const serviceChart = useMemo(
    () =>
      [...(spans.data ?? [])]
        .sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0))
        .slice(0, 12)
        .map((s) => ({ name: s.route_short_name ?? s.route_id, hours: s.service_hours ?? 0 })),
    [spans.data],
  );

  const topRoutes = useMemo(
    () => [...(spans.data ?? [])].sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0)).slice(0, 3),
    [spans.data],
  );

  const retry = () => {
    routes.refetch();
    stops.refetch();
    coverage.refetch();
    headway.refetch();
    spans.refetch();
    versions.refetch();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load dashboard data" onRetry={retry} />;

  const cv = coverage.data ?? [];
  const feedV = versions.data ?? [];

  const avgHeadway = hw.length
    ? (hw.reduce((s, h) => s + h.avg_headway_minutes, 0) / hw.length).toFixed(1)
    : '0';
  const totalStops = stops.data?.total ?? 0;
  const stations = cv.reduce((s, c) => s + c.unique_stations, 0);
  const totalRoutes = routes.data?.total ?? 0;
  const latest = feedV[0] ?? null;
  const longest = sp.length
    ? sp.reduce((a, b) => ((b.service_hours ?? 0) > (a.service_hours ?? 0) ? b : a))
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sage pulse-dot" />
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              Live feed {latest ? `v${latest.feed_version_id}` : ''} · {latest ? fmtDate(latest.fetch_timestamp) : '—'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight">
            <span className="text-ink">Transjakarta</span>{' '}
            <span className="text-beige">Network Intelligence</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
          <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <GitBranch size={12} className="text-beige/70" />
            {formatNumber(hw.length)} route-hour pairs
          </span>
          <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Rss size={12} className="text-sage" />
            CDC diff tracking
          </span>
          <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <CalendarDays size={12} className="text-beige/70" />
            {feedV.length} feed versions
          </span>
        </div>
      </header>

      {/* Map centerpiece + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <MapView heightClass="h-[460px]" sidebar={false} initialRoute="13" />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard compact item={{ label: 'Total Routes', value: formatNumber(totalRoutes), sub: 'corridors', icon: 'route' }} delay={0} />
            <KpiCard compact item={{ label: 'Stops', value: formatNumber(totalStops), sub: 'across network', icon: 'stop' }} delay={50} />
            <KpiCard compact item={{ label: 'Stations', value: formatNumber(stations), sub: 'unique nodes', icon: 'station' }} delay={100} />
            <KpiCard compact item={{ label: 'Avg Headway', value: `${avgHeadway} min`, sub: 'network avg', icon: 'clock' }} delay={150} />
          </div>

          <ChartCard title="Top Corridors" subtitle="Longest daily service windows" bodyClassName="pt-3">
            <div className="space-y-3">
              {topRoutes.map((r, i) => {
                const hours = r.service_hours ?? 0;
                const max = topRoutes[0]?.service_hours ?? 1;
                return (
                  <div key={r.route_id} className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-semibold text-beige w-12 shrink-0 truncate">
                      {r.route_short_name ?? r.route_id}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/15 shrink-0" />
                    <div className="flex-1 h-5 bg-white/[0.04] rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-beige/60 to-beige/20"
                        style={{ width: `${Math.max(8, (hours / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink-muted w-9 text-right shrink-0">{hours.toFixed(1)}h</span>
                    {i === 0 && (
                      <span className="text-[9px] uppercase tracking-wider text-sage w-8 shrink-0">top</span>
                    )}
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Feed History" subtitle="GTFS versions captured by the pipeline" bodyClassName="pt-3">
            <div className="relative pl-5 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-white/[0.08] space-y-3">
              {feedV.slice(0, 5).map((v, i) => (
                <div key={v.feed_version_id} className="relative">
                  <span
                    className={`absolute -left-5 top-0.5 w-[15px] h-[15px] rounded-full border-2 ${
                      i === 0
                        ? 'bg-sage border-graphite shadow-[0_0_0_3px_rgba(109,156,123,0.25)]'
                        : 'bg-card border-white/25'
                    }`}
                  />
                  <p className="text-[13px] font-medium text-ink leading-tight">
                    Version {v.feed_version_id}
                    {i === 0 && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-sage">latest</span>}
                  </p>
                  <p className="text-[11px] text-ink-dim mt-0.5">
                    {fmtBytes(v.file_size_bytes)} · {fmtDate(v.fetch_timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Average Headway by Hour" subtitle="Network-wide average between 04:00 and midnight">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headwayChart} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: '#6f6a63', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}:00`}
                  interval={2}
                />
                <YAxis tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(212,201,168,0.06)' }} />
                <Bar dataKey="avg" fill="#d4c9a8" radius={[5, 5, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Service Hours by Route" subtitle="Top 12 corridors by daily service window">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceChart} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6f6a63', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a6a097', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(109,156,123,0.06)' }} />
                <Bar dataKey="hours" fill="#6d9c7b" radius={[0, 4, 4, 0]} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {longest && (
        <p className="text-[11px] text-ink-dim flex items-center gap-1.5">
          <CalendarDays size={12} className="text-beige/70" />
          Longest service: route {longest.route_short_name ?? longest.route_id} ·{' '}
          {longest.first_departure?.slice(0, 5) ?? '—'} – {longest.last_departure?.slice(0, 5) ?? '—'} ·{' '}
          {(longest.service_hours ?? 0).toFixed(1)}h
        </p>
      )}
    </div>
  );
}