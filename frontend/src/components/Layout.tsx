import { Outlet, useLocation } from 'react-router-dom';
import IslandNav from './IslandNav';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-graphite text-ink font-sans">
      {/* Ambient glow */}
      <div className="fixed inset-x-0 top-0 h-[420px] glow-beige pointer-events-none -z-10" />

      <IslandNav />

      <main className="relative max-w-[1320px] mx-auto px-4 sm:px-6 pt-20 pb-14" key={pathname}>
        <Outlet />
      </main>

      <footer className="relative border-t border-white/[0.05] py-5">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-dim">
          <p>Transjakarta Network Intelligence — GTFS pipeline dashboard.</p>
          <p>PostgreSQL · FastAPI · React · MapLibre</p>
        </div>
      </footer>
    </div>
  );
}