import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <Loader2 className="w-10 h-10 text-[#003478] animate-spin" />
      </div>
      <p className="text-sm text-[#64748B]">{message}</p>
    </motion.div>
  );
}
