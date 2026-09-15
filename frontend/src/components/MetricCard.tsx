import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  icon?: ReactNode;
}

export default function MetricCard({ label, value, subtext, color, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E8EAED] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color: color || '#1A1A2E' }}>{value}</p>
          {subtext && <p className="text-xs text-[#6B7280] mt-1">{subtext}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color || '#003478'}15` }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
