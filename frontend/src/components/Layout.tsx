import { useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Map, BarChart3, PieChart, GitBranch, Info } from 'lucide-react';

const NAV = [
  { path: '/', icon: Map, label: 'Routes' },
  { path: '/headway', icon: BarChart3, label: 'Headway' },
  { path: '/coverage', icon: PieChart, label: 'Coverage' },
  { path: '/changes', icon: GitBranch, label: 'Changes' },
  { path: '/about', icon: Info, label: 'About' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const go = useCallback((p: string) => navigate(p), [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Floating Island Nav */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-5 py-2 flex items-center gap-1 shadow-2xl">
        {NAV.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              title={item.label}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200
                ${active ? 'bg-blue-500/15 text-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'}`}
              onClick={() => go(item.path)}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          );
        })}
      </nav>

      {/* Page Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
