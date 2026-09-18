import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function ChartCard({ title, subtitle, actions, children, className = '', bodyClassName = '' }: Props) {
  return (
    <section className={`glass rounded-2xl overflow-hidden ${className}`}>
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex flex-wrap items-start gap-3 border-b border-white/[0.055]">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base font-semibold text-ink tracking-[-0.03em]">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={`p-5 sm:p-6 pt-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
