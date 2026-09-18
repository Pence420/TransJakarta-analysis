import { Database, ShieldCheck, GitBranch, BarChart3, Map, Zap, Layers, Lock, Activity, Server, Network, FileSearch } from 'lucide-react';

const FEATURES = [
  { icon: Database, title: 'GTFS Pipeline', desc: 'Automated extract, load, and transform of official Transjakarta GTFS data.' },
  { icon: GitBranch, title: 'CDC Diff Engine', desc: 'Change detection between feed versions with before/after tracking.' },
  { icon: BarChart3, title: 'Analytics Marts', desc: 'Headway analysis, coverage metrics, and service span calculations.' },
  { icon: Map, title: 'Interactive Map', desc: '240+ corridors traced on MapLibre GL with route selection.' },
  { icon: ShieldCheck, title: 'Security First', desc: 'Read-only API, rate limiting, input validation, role-based access.' },
  { icon: Zap, title: 'FastAPI Serving', desc: 'Parameterized REST endpoints with pagination and filtering.' },
];

const TECH = [
  { name: 'PostgreSQL', role: 'Primary database with 4-schema architecture', icon: Database },
  { name: 'PostGIS', role: 'Spatial extensions for network coordinates', icon: Globe2Mark },
  { name: 'Python', role: 'ETL pipeline, CDC engine, API layer', icon: Server },
  { name: 'FastAPI', role: 'Read-only REST API with rate limiting', icon: Zap },
  { name: 'React', role: 'Modern SPA with TypeScript & TanStack Query', icon: Network },
  { name: 'MapLibre GL', role: 'WebGL map rendering for route visualization', icon: Map },
  { name: 'Recharts', role: 'Responsive data visualization charts', icon: BarChart3 },
  { name: 'Tailwind CSS', role: 'Utility-first styling on a graphite theme', icon: Layers },
];

const PRINCIPLES = [
  'Choose common components wisely',
  'Plan for failure',
  'Architect for scalability',
  'Architecture is leadership',
  'Always be architecting',
  'Build loosely coupled systems',
  'Make reversible decisions',
  'Prioritize security',
  'Embrace FinOps',
];

function Globe2Mark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-beige">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-8">
      <header className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end border-b border-white/[0.07] pb-8">
        <div>
          <p className="page-kicker mb-3">System brief / 01</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.07em] text-ink text-balance">
            Transjakarta <span className="text-beige">Network Intelligence</span>
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-2xl mt-4 leading-relaxed">
            A data engineering pipeline that turns raw GTFS feeds into live operations insight for Jakarta’s bus rapid transit network.
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="panel-label mb-4">Workspace capabilities</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Activity size={13} className="text-sage" /> Live data</span>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <span className="flex items-center gap-1.5"><Lock size={13} className="text-beige" /> Read-only API</span>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <span className="flex items-center gap-1.5"><Layers size={13} className="text-beige" /> 4-schema model</span>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <span className="flex items-center gap-1.5"><FileSearch size={13} className="text-beige" /> CDC change tracking</span>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-end justify-between gap-5 mb-5">
          <div>
            <p className="page-kicker mb-2">What it monitors</p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.045em] text-ink">Operational surfaces</h2>
          </div>
          <span className="hidden sm:block font-mono text-[10px] text-ink-dim">06 MODULES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glass rounded-2xl p-5 hover:bg-card-hover hover:border-beige/20 hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-beige/10 ring-1 ring-beige/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-beige" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-base font-semibold tracking-[-0.025em] text-ink mb-1.5">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-5 mb-5">
          <div>
            <p className="page-kicker mb-2">Architecture</p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.045em] text-ink">System stack</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TECH.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.name} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
                <div className="w-9 h-9 rounded-lg bg-beige/10 ring-1 ring-beige/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-beige" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted">{t.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className="page-kicker mb-2">Operating principles</p>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.045em] text-ink mb-5">Nine principles of good data architecture</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRINCIPLES.map((p, i) => (
            <div key={p} className="glass rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors">
              <span className="font-mono text-[11px] text-beige/80 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm text-ink-muted">{p}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
