import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarDays } from 'lucide-react';
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
  return Array.from({ length: 21 }, (_, i) => i + 4).map((hour) => {
    const v = buckets.get(hour);
    return { hour, avg: v ? Math.round((v.sum / v.count) * 10) / 10 : 0 };
  });
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
    <div className="space-y-5 sm:space-y-6">
      <header className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-5 border-b border-white/[0.07] pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 page-kicker mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sage pulse-dot shadow-[0_0_10px_rgba(109,156,123,0.9)]" />
            Live network telemetry
          </div>
          <h1 className="font-display text-[2rem] leading-none sm:text-[2.65rem] font-semibold tracking-[-0.065em] text-balance">
            <span className="text-ink">Transjakarta</span>{' '}
            <span className="text-beige">command center</span>
          </h1>
          <p className="text-sm text-ink-muted mt-3 max-w-xl leading-relaxed">
            Monitor routes, service rhythm, and feed changes from a single live GTFS workspace.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-xl border border-white/[0.07] bg-black/10 px-1 sm:min-w-[410px]">
          <div className="px-3 py-2.5">
            <p className="panel-label">Data points</p>
            <p className="text-xs font-semibold text-ink mt-1 whitespace-nowrap">{formatNumber(hw.length)} pairs</p>
          </div>
          <div className="px-3 py-2.5">
            <p className="panel-label">Pipeline</p>
            <p className="text-xs font-semibold text-sage mt-1 whitespace-nowrap">CDC tracking</p>
          </div>
          <div className="px-3 py-2.5">
            <p className="panel-label">Latest feed</p>
            <p className="text-xs font-semibold text-ink mt-1 whitespace-nowrap">v{latest?.feed_version_id ?? '—'}</p>
          </div>
        </div>
      </header>

      {/* Map centerpiece + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="xl:col-span-8">
          <MapView heightClass="h-[480px] sm:h-[520px]" sidebar={false} initialRoute="13" />
        </div>

        <aside className="xl:col-span-4 space-y-4" aria-label="Network summary">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard compact item={{ label: 'Total Routes', value: formatNumber(totalRoutes), sub: 'corridors', icon: 'route' }} delay={0} />
            <KpiCard compact item={{ label: 'Stops', value: formatNumber(totalStops), sub: 'across network', icon: 'stop' }} delay={50} />
            <KpiCard compact item={{ label: 'Stations', value: formatNumber(stations), sub: 'unique nodes', icon: 'station' }} delay={100} />
            <KpiCard compact item={{ label: 'Avg Headway', value: `${avgHeadway} min`, sub: 'network avg', icon: 'clock' }} delay={150} />
          </div>

          <ChartCard title="Longest active corridors" subtitle="Daily service window across the network" bodyClassName="pt-4">
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
                    <div className="flex-1 h-5 bg-black/20 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-beige/60 to-beige/20"
                        style={{ width: `${Math.max(8, (hours / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink-muted w-9 text-right shrink-0">{hours.toFixed(1)}h</span>
                    {i === 0 && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-sage w-8 shrink-0">top</span>
                    )}
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Feed history" subtitle="GTFS snapshots captured by the pipeline" bodyClassName="pt-4">
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
                  <p className="text-[13px] font-semibold text-ink leading-tight">
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
        </aside>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <ChartCard className="xl:col-span-7" title="Average headway by hour" subtitle="Network-wide average between 04:00 and midnight">
          <div className="h-[260px] w-full">
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

        <ChartCard className="xl:col-span-5" title="Service hours by route" subtitle="Top 12 corridors by daily service window">
          <div className="h-[260px] w-full">
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
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim flex items-center gap-1.5 pt-1">
          <CalendarDays size={12} className="text-beige/70" />
          Longest service: route {longest.route_short_name ?? longest.route_id} ·{' '}
          {longest.first_departure?.slice(0, 5) ?? '—'} – {longest.last_departure?.slice(0, 5) ?? '—'} ·{' '}
          {(longest.service_hours ?? 0).toFixed(1)}h
        </p>
      )}
    </div>
  );
}
