import { NavLink } from 'react-router-dom';
import { Map, BarChart3, PieChart, GitBranch, Info } from 'lucide-react';

const navItems = [
  { to: '/', icon: Map, label: 'Routes' },
  { to: '/headway', icon: BarChart3, label: 'Headway' },
  { to: '/coverage', icon: PieChart, label: 'Coverage' },
  { to: '/changes', icon: GitBranch, label: 'Changes' },
  { to: '/about', icon: Info, label: 'About' },
];

export default function TopNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur-xl rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-white/50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-[#003478] text-white shadow-lg shadow-[#003478]/30'
                  : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#1A1A2E]'
              }`
            }
            title={item.label}
          >
            <item.icon size={18} strokeWidth={2} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
