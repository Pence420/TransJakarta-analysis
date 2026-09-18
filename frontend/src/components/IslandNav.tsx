import { NavLink } from 'react-router-dom';
import { Gauge, Map, BarChart3, MapPin, GitBranch, Info } from 'lucide-react';
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
  { path: '/coverage', icon: MapPin, label: 'Network Coverage' },
  { path: '/changes', icon: GitBranch, label: 'Feed Changes' },
  { path: '/about', icon: Info, label: 'About' },
];

export default function IslandNav() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full p-1.5 flex items-center gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.label}
            aria-label={item.label}
            className="group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-beige/15' : 'bg-transparent group-hover:bg-white/[0.05]'
                  }`}
                />
                <Icon
                  size={17}
                  strokeWidth={1.75}
                  className={`relative transition-colors duration-200 ${
                    isActive ? 'text-beige' : 'text-ink-dim group-hover:text-ink'
                  }`}
                />
                {isActive && <span className="absolute bottom-[5px] w-1 h-1 rounded-full bg-beige" />}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}