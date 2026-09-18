import type { ReactNode } from 'react';

export default function PageTitle({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl sm:text-[22px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}