import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: string;
  index?: number;
}

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = '#003478',
  index = 0,
}: Props) {
  return (
    <motion.div
      className="glass rounded-2xl p-5 hover:bg-[rgba(30,41,59,0.6)] transition-all duration-300
        hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {Icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg
              transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtext && (
        <div className="text-xs text-[#64748B]">{subtext}</div>
      )}
    </motion.div>
  );
}
