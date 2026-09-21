import { useMemo, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Activity, ArrowUpRight, Route as RouteIcon, Timer, Waypoints, Clock3, Network, TrendingUp, Sunrise, MoonStar } from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';
import MapView from '../components/MapView';
import { Spinner, ErrorState } from '../components/LoadingState';
import DataTable, { type Column } from '../components/DataTable';
import type { ServiceSpan } from '../lib/types';

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-ink-dim mb-0.5">{label}</p>
      <p className="text-ink font-semibold">{payload[0].value}</p>
    </div>
  );
}

function timeToMinutes(value?: string | null): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function displayServiceTime(minutes: number | null): string {
  if (minutes === null) return '—';
  const day = minutes >= 24 * 60 ? ' +1' : '';
  const normalized = minutes % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}${day}`;
}

export default function OverviewPage() {
  const routes = useQuery({ queryKey: ['routes-count'], queryFn: () => api.getRoutes(1, 0) });
  const stops = useQuery({ queryKey: ['stops-count'], queryFn: () => api.getStops(1, 0) });
  const coverage = useQuery({ queryKey: ['coverage'], queryFn: () => api.getCoverage() });
  const headway = useQuery({ queryKey: ['headway'], queryFn: () => api.getHeadway() });
  const spans = useQuery({ queryKey: ['service-span'], queryFn: () => api.getServiceSpan() });

  const loading = routes.isLoading || stops.isLoading || coverage.isLoading || headway.isLoading || spans.isLoading;
  const error = routes.error || stops.error || coverage.error || headway.error || spans.error;

  const hw = useMemo(() => headway.data ?? [], [headway.data]);
  const sp = useMemo(() => spans.data ?? [], [spans.data]);

  const headwayChart = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    hw
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
  }, [hw]);

  const topRoutes = useMemo(
    () => [...sp].sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0)).slice(0, 3),
    [sp],
  );

  const serviceWindow = useMemo(() => {
    const starts = sp.map((route) => timeToMinutes(route.first_departure)).filter((value): value is number => value !== null);
    const ends = sp.map((route) => timeToMinutes(route.last_departure)).filter((value): value is number => value !== null);
    const first = starts.length ? Math.min(...starts) : null;
    const last = ends.length ? Math.max(...ends) : null;
    return { first, last, duration: first !== null && last !== null ? Math.max(0, last - first) : 0 };
  }, [sp]);

  const headwayByRoute = useMemo(() => {
    const groups = new Map<string, { sum: number; count: number }>();
    hw.forEach((item) => {
      const current = groups.get(item.route_id) ?? { sum: 0, count: 0 };
      current.sum += item.avg_headway_minutes;
      current.count += 1;
      groups.set(item.route_id, current);
    });
    return new Map(Array.from(groups, ([routeId, value]) => [routeId, value.sum / value.count]));
  }, [hw]);
  const activityRows = useMemo(
    () => [...sp].sort((a, b) => (b.service_hours ?? 0) - (a.service_hours ?? 0)).slice(0, 8),
    [sp],
  );

  const retry = () => {
    routes.refetch();
    stops.refetch();
    coverage.refetch();
    headway.refetch();
    spans.refetch();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load dashboard data" onRetry={retry} />;

  const cv = coverage.data ?? [];
  const avgHeadway = hw.length
    ? (hw.reduce((s, h) => s + h.avg_headway_minutes, 0) / hw.length).toFixed(1)
    : '0';
  const totalStops = stops.data?.total ?? 0;
  const stations = cv.reduce((s, c) => s + c.unique_stations, 0);
  const totalRoutes = routes.data?.total ?? 0;
  const trackedRoutes = sp.length;
  const serviceProgress = totalRoutes ? Math.min(100, Math.round((trackedRoutes / totalRoutes) * 100)) : 0;
  const avgServiceHours = trackedRoutes
    ? (sp.reduce((sum, route) => sum + (route.service_hours ?? 0), 0) / trackedRoutes).toFixed(1)
    : '0';
  const peakHeadway = headwayChart.reduce((peak, point) => point.avg > peak.avg ? point : peak, { hour: 0, avg: 0 });
  const measuredCorridors = new Set(hw.map((item) => item.route_id)).size;
  const activityColumns: Column<ServiceSpan>[] = [
    {
      key: 'corridor',
      header: 'Corridor',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <span className="w-7 h-7 rounded-lg bg-beige text-graphite text-[10px] font-bold grid place-items-center">
            {row.route_short_name?.slice(0, 3) ?? 'RT'}
          </span>
          <div className="min-w-0"><p className="text-xs font-semibold text-ink truncate">{row.route_short_name ?? row.route_id}</p><p className="text-[10px] font-mono text-ink-dim truncate">{row.route_id}</p></div>
        </div>
      ),
    },
    { key: 'route', header: 'Route', render: (row) => <span className="text-xs text-ink-muted block min-w-[180px] truncate">{row.route_long_name ?? '—'}</span> },
    { key: 'window', header: 'Service window', render: (row) => <span className="font-mono text-[11px] text-ink-muted whitespace-nowrap">{row.first_departure?.slice(0, 5) ?? '—'} – {row.last_departure?.slice(0, 5) ?? '—'}</span> },
    { key: 'headway', header: 'Avg headway', render: (row) => <span className="text-xs text-ink whitespace-nowrap">{headwayByRoute.get(row.route_id)?.toFixed(1) ?? '—'} min</span>, align: 'right' },
    { key: 'status', header: 'Status', render: () => <span className="inline-flex items-center gap-1.5 text-[11px] text-sage whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-sage" />Tracked</span>, align: 'right' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2 page-kicker mb-2"><span className="w-1.5 h-1.5 rounded-full bg-sage pulse-dot" />Live network telemetry</div>
          <h1 className="font-display text-[1.65rem] sm:text-3xl font-semibold tracking-[-0.06em] text-ink">Network intelligence</h1>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted"><span className="hidden sm:inline">GTFS operations workspace</span><span className="w-px h-4 bg-white/10" /><span className="font-mono text-sage">LIVE</span></div>
      </header>

      <div className="command-center-grid">
        <aside className="command-rail space-y-4" aria-label="Service intelligence">
          <section className="glass rounded-[1.35rem] p-5 overflow-hidden relative">
            <ArrowUpRight size={16} className="absolute right-5 top-5 text-ink-dim" />
            <p className="text-lg font-display font-semibold tracking-[-0.04em] text-ink">Today’s service progress</p>
            <div className="mt-5 grid place-items-center"><div className="service-orbit" style={{ '--progress': `${serviceProgress * 3.6}deg` } as CSSProperties}><div><strong>{serviceProgress}%</strong><span>profiled</span></div></div></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-sm font-semibold text-ink">{formatNumber(totalRoutes)}</p><p className="panel-label mt-1">routes</p></div><div><p className="text-sm font-semibold text-ink">{formatNumber(totalStops)}</p><p className="panel-label mt-1">stops</p></div><div><p className="text-sm font-semibold text-ink">{formatNumber(stations)}</p><p className="panel-label mt-1">stations</p></div></div>
            <p className="text-[11px] text-ink-dim text-center mt-4">{formatNumber(trackedRoutes)} corridors have scheduled service data.</p>
          </section>

          <section className="glass rounded-[1.35rem] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-display font-semibold tracking-[-0.04em] text-ink">Corridor distribution</p><p className="text-[11px] text-ink-dim mt-1">Longest scheduled service windows</p></div><RouteIcon size={16} className="text-ink-dim" /></div><div className="space-y-3.5 mt-5">{topRoutes.map((route, index) => { const max = topRoutes[0]?.service_hours ?? 1; const hours = route.service_hours ?? 0; return <div key={route.route_id} className="grid grid-cols-[1fr_auto] gap-x-3"><div className="flex items-center gap-2 min-w-0"><span className={`route-chip route-chip-${index}`}>{route.route_short_name ?? route.route_id.slice(0, 2)}</span><span className="text-xs text-ink-muted truncate">{route.route_long_name ?? route.route_id}</span></div><span className="font-mono text-[10px] text-beige">{hours.toFixed(1)}h</span><div className="col-span-2 h-1.5 rounded-full bg-white/[0.07] overflow-hidden mt-2"><span className={`block h-full rounded-full route-fill-${index}`} style={{ width: `${Math.max(10, (hours / max) * 100)}%` }} /></div></div>; })}</div></section>

          <section className="glass rounded-[1.35rem] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-display font-semibold tracking-[-0.04em] text-ink">Headway rhythm</p><p className="text-[11px] text-ink-dim mt-1">Average interval across the day</p></div><Timer size={16} className="text-ink-dim" /></div><div className="mt-5 flex items-end h-20 gap-[3px]">{headwayChart.filter((point) => point.avg > 0).map((point) => <span key={point.hour} className="flex-1 min-w-[3px] rounded-t-sm bg-beige/70" style={{ height: `${Math.max(10, Math.min(100, (point.avg / 25) * 100))}%` }} title={`${point.hour}:00 · ${point.avg} min`} />)}</div><div className="mt-4 flex items-baseline justify-between"><div><p className="metric-value text-3xl text-ink">{avgHeadway}<span className="text-sm tracking-normal ml-1 text-ink-muted">min</span></p><p className="panel-label mt-1">network average</p></div><div className="text-right"><p className="text-xs text-sage">{formatNumber(hw.length)}</p><p className="panel-label mt-1">data pairs</p></div></div></section>

          <section className="glass rounded-[1.35rem] p-5 service-window-card">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-lg font-display font-semibold tracking-[-0.04em] text-ink">Service window</p><p className="text-[11px] text-ink-dim mt-1">Daily network operating envelope</p></div>
              <Clock3 size={16} className="text-ink-dim" />
            </div>
            <div className="service-window-track mt-6"><span /><i /></div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="service-window-point"><Sunrise size={14} /><div><p className="panel-label">First pull-out</p><p>{displayServiceTime(serviceWindow.first)}</p></div></div>
              <div className="service-window-point justify-end text-right"><div><p className="panel-label">Final arrival</p><p>{displayServiceTime(serviceWindow.last)}</p></div><MoonStar size={14} /></div>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-baseline justify-between"><span className="panel-label">Active span</span><strong className="font-display text-xl tracking-[-0.04em] text-beige">{(serviceWindow.duration / 60).toFixed(1)} h</strong></div>
          </section>
        </aside>

        <div className="command-workspace space-y-4">
          <section><MapView heightClass="h-[455px] sm:h-[550px]" sidebar={false} initialRoute={topRoutes[0]?.route_id ?? null} /></section>
          <section className="glass rounded-[1.35rem] overflow-hidden"><div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-xl font-semibold tracking-[-0.04em] text-ink">Network activity</p><p className="text-[11px] text-ink-dim mt-1">Scheduled corridors currently tracked in the feed</p></div><div className="flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5"><Activity size={12} className="text-sage" /><span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">{formatNumber(activityRows.length)} visible</span></div></div><DataTable columns={activityColumns} rows={activityRows} empty="No corridor service data available." /></section>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <section className="glass rounded-[1.35rem] px-5 sm:px-6 pt-5 sm:pt-6 pb-3 xl:col-span-8"><div className="flex items-start justify-between gap-4 mb-3"><div><p className="font-display text-lg font-semibold tracking-[-0.04em] text-ink">Average headway by hour</p><p className="text-xs text-ink-muted mt-1">Network-wide average between 04:00 and midnight</p></div><Waypoints size={16} className="text-ink-dim" /></div><div className="h-[220px] w-full">
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
          </div></section>
        <section className="glass rounded-[1.35rem] p-5 sm:p-6 xl:col-span-4"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-semibold tracking-[-0.04em] text-ink">Operational signals</p><p className="text-xs text-ink-muted mt-1">Network intelligence at a glance</p></div><TrendingUp size={16} className="text-sage" /></div><div className="mt-5 space-y-4"><div className="signal-row"><span className="signal-icon"><Clock3 size={14} /></span><div><p className="panel-label">Peak interval</p><p className="text-sm font-semibold text-ink mt-1">{peakHeadway.avg.toFixed(1)} min <span className="text-ink-dim font-normal">at {peakHeadway.hour}:00</span></p></div></div><div className="signal-row"><span className="signal-icon"><Network size={14} /></span><div><p className="panel-label">Measured corridors</p><p className="text-sm font-semibold text-ink mt-1">{formatNumber(measuredCorridors)} <span className="text-ink-dim font-normal">of {formatNumber(totalRoutes)} routes</span></p></div></div><div className="signal-row"><span className="signal-icon"><Activity size={14} /></span><div><p className="panel-label">Avg service window</p><p className="text-sm font-semibold text-ink mt-1">{avgServiceHours} h <span className="text-ink-dim font-normal">per corridor</span></p></div></div></div></section>
      </div>
    </div>
  );
}
