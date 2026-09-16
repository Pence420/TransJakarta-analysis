import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <p className="text-xl text-[#94A3B8] mb-8">Page not found</p>
        <button
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-[#003478] text-white
            text-sm font-medium hover:bg-[#1A73E8] transition-colors duration-200"
          onClick={() => navigate('/')}
        >
          <Home size={16} />
          Back to Routes
        </button>
      </motion.div>
    </div>
  );
}
