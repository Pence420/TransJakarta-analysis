import { Outlet, useLocation } from 'react-router-dom';
import IslandNav from './IslandNav';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-graphite text-ink font-sans overflow-x-clip">
      {/* Ambient glow */}
      <div className="fixed inset-x-0 top-0 h-[420px] glow-beige pointer-events-none -z-10" />

      <IslandNav />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[70] focus:left-4 focus:top-4 rounded-md bg-beige px-3 py-2 text-sm font-semibold text-graphite">
        Skip to content
      </a>

      <main id="main-content" className="relative max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16" key={pathname}>
        <Outlet />
      </main>

      <footer className="relative border-t border-white/[0.06] py-5">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-dim">
          <p className="font-mono">TRANSJAKARTA / NETWORK INTELLIGENCE</p>
          <p>PostgreSQL · FastAPI · React · MapLibre</p>
        </div>
      </footer>
    </div>
  );
}
