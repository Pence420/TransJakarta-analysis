import type { ReactNode } from 'react';
import AnimatedSection from './AnimatedSection';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
}

export default function ChartCard({ title, subtitle, children, delay = 0 }: Props) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </AnimatedSection>
  );
}
