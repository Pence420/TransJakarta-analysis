import type { ReactNode } from 'react';

export default function PageTitle({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/[0.07] pb-5">
      <div className="max-w-2xl">
        <p className="page-kicker mb-2">Operations / analysis</p>
        <h1 className="font-display text-3xl sm:text-[34px] font-semibold tracking-[-0.055em] text-ink text-balance">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] sm:text-sm text-ink-muted mt-2 leading-relaxed max-w-xl">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}
