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
        className="glass rounded-xl p-3 hover:bg-white/[0.05] transition-colors duration-300 animate-fade-up flex items-start gap-2.5"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-7 h-7 rounded-md bg-beige/10 flex items-center justify-center mt-0.5 shrink-0">
          <Icon size={13} className="text-beige" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold font-display leading-none text-ink">{item.value}</p>
          {item.label && (
            <p className="text-[10px] uppercase tracking-[0.08em] text-ink-dim mt-1 truncate">{item.label}</p>
          )}
          {item.sub && <p className="text-[10px] text-ink-muted mt-0.5 truncate">{item.sub}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl p-4 sm:p-5 hover:bg-white/[0.05] transition-colors duration-300 animate-fade-up flex flex-col gap-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-beige/10 flex items-center justify-center">
          <Icon size={15} className="text-beige" strokeWidth={1.75} />
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-dim font-medium">{item.label}</span>
      </div>
      <div>
        <p className="font-display text-2xl sm:text-[28px] font-semibold leading-none text-ink">
          {item.value}
        </p>
        {item.sub && <p className="text-xs text-ink-muted mt-1.5">{item.sub}</p>}
      </div>
    </div>
  );
}