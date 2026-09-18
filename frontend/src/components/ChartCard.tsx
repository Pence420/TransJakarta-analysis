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
    <section className={`glass rounded-2xl ${className}`}>
      <div className="px-5 pt-5 pb-1 flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-ink tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={`p-5 pt-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}