import { NavLink } from 'react-router-dom';
import { Gauge, Map, BarChart3, GitBranch, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const NAV: NavItem[] = [
  { path: '/', icon: Gauge, label: 'Overview' },
  { path: '/map', icon: Map, label: 'Network Map' },
  { path: '/headway', icon: BarChart3, label: 'Headway Analysis' },
  { path: '/changes', icon: GitBranch, label: 'Feed Changes' },
  { path: '/about', icon: Info, label: 'About' },
];

export default function IslandNav() {
  return (
    <nav aria-label="Primary navigation" className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-[1.1rem] sm:rounded-full p-1 flex items-center gap-0.5 sm:gap-1 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.label}
            aria-label={item.label}
            className="group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.96]"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-beige/15 ring-1 ring-beige/15' : 'bg-transparent group-hover:bg-white/[0.07]'
                  }`}
                />
                <Icon
                  size={16}
                  strokeWidth={1.75}
                  className={`relative transition-colors duration-200 ${
                    isActive ? 'text-beige' : 'text-ink-dim group-hover:text-ink'
                  }`}
                />
                {isActive && <span className="absolute bottom-[4px] w-1 h-1 rounded-full bg-beige shadow-[0_0_8px_rgba(212,201,168,0.8)]" />}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
