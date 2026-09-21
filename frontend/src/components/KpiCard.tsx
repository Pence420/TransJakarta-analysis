import { Route, Bus, Building2, MapPin, Clock, CalendarDays, Activity, Gauge } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KpiItem } from '../lib/types';

const ICONS: Record<KpiItem['icon'], LucideIcon> = {
  route: Route,
  stop: Bus,
  station: Building2,
  zone: MapPin,
  clock: Clock,
  calendar: CalendarDays,
  activity: Activity,
  gauge: Gauge,
};

export default function KpiCard({ item, delay = 0, compact = false }: { item: KpiItem; delay?: number; compact?: boolean }) {
  const Icon = ICONS[item.icon];

  if (compact) {
    return (
      <div
        className="glass rounded-xl p-3.5 hover:bg-card-hover hover:-translate-y-0.5 transition-[transform,background-color,border-color] duration-300 animate-fade-up flex items-start gap-3"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-7 h-7 rounded-lg bg-beige/10 ring-1 ring-beige/10 flex items-center justify-center mt-0.5 shrink-0">
          <Icon size={13} className="text-beige" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="metric-value text-lg font-semibold leading-none text-ink">{item.value}</p>
          {item.label && (
            <p className="panel-label mt-1.5 truncate">{item.label}</p>
          )}
          {item.sub && <p className="text-[10px] text-ink-muted mt-0.5 truncate">{item.sub}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl p-4 sm:p-5 hover:bg-card-hover hover:-translate-y-0.5 transition-[transform,background-color,border-color] duration-300 animate-fade-up flex flex-col gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-beige/10 ring-1 ring-beige/10 flex items-center justify-center">
          <Icon size={15} className="text-beige" strokeWidth={1.75} />
        </div>
        <span className="panel-label">{item.label}</span>
      </div>
      <div>
        <p className="metric-value text-3xl sm:text-[32px] font-semibold leading-none text-ink">
          {item.value}
        </p>
        {item.sub && <p className="text-xs text-ink-muted mt-1.5">{item.sub}</p>}
      </div>
    </div>
  );
}
