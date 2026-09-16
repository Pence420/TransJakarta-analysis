import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)]">
        <AlertTriangle className="text-[#EF4444]" size={28} />
      </div>
      <p className="text-[#94A3B8] text-lg">{message}</p>
      {onRetry && (
        <button
          className="px-6 py-2.5 rounded-full bg-[#003478] text-white text-sm font-medium
            hover:bg-[#1A73E8] transition-colors duration-200"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}
