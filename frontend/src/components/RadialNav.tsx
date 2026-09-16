import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, BarChart3, PieChart, GitBranch, Info, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Map, label: 'Routes' },
  { path: '/headway', icon: BarChart3, label: 'Headway' },
  { path: '/coverage', icon: PieChart, label: 'Coverage' },
  { path: '/changes', icon: GitBranch, label: 'Changes' },
  { path: '/about', icon: Info, label: 'About' },
];

export default function RadialNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="menu"
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {NAV_ITEMS.map((item, i) => {
                const angle = -90 - (i * (180 / (NAV_ITEMS.length - 1)));
                const radius = 140;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.path}
                    className={`absolute flex items-center gap-3 px-4 py-2.5 rounded-full
                      ${isActive
                        ? 'bg-[#003478] text-white glow-blue'
                        : 'glass text-[#94A3B8] hover:text-white hover:bg-[rgba(30,41,59,0.8)]'
                      } transition-colors duration-200 whitespace-nowrap`}
                    style={{ bottom: 50, right: 50 }}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      delay: i * 0.05,
                    }}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                );
              })}

              <motion.button
                className="absolute flex items-center justify-center w-14 h-14 rounded-full
                  bg-[#003478] text-white glow-blue cursor-pointer"
                style={{ bottom: 50, right: 50 }}
                initial={{ scale: 1 }}
                animate={{ rotate: 45 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => setIsOpen(false)}
              >
                <X size={22} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              className="flex items-center justify-center w-14 h-14 rounded-full
                bg-[#003478] text-white glow-blue cursor-pointer
                hover:bg-[#1A73E8] transition-colors duration-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
            >
              <Map size={22} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="glass-strong mx-auto mt-4 flex items-center gap-1 px-2 py-2 rounded-full
          max-w-fit">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[#003478] text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                onClick={() => handleNavigate(item.path)}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
