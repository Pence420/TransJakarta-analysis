import { Database, Shield, GitBranch, BarChart3, Map, Zap, Layers, Lock, Activity } from 'lucide-react';

const FEATURES = [
  { icon: Database, title: 'GTFS Pipeline', desc: 'Automated extract, load, and transform of Transjakarta GTFS data' },
  { icon: GitBranch, title: 'CDC Diff Engine', desc: 'Change detection between feed versions with before/after tracking' },
  { icon: BarChart3, title: 'Analytics Marts', desc: 'Headway analysis, coverage metrics, and service span calculations' },
  { icon: Map, title: 'Interactive Map', desc: 'All 240+ routes visualized with real-time stop data on MapLibre GL' },
  { icon: Shield, title: 'Security First', desc: 'Read-only API, rate limiting, input validation, and role-based access' },
  { icon: Zap, title: 'Real-time API', desc: 'FastAPI-powered REST endpoints with pagination and filtering' },
];

const TECH = [
  { name: 'PostgreSQL', role: 'Primary database with 4-schema architecture' },
  { name: 'Python', role: 'ETL pipeline, CDC engine, and API layer' },
  { name: 'FastAPI', role: 'High-performance async REST API' },
  { name: 'React', role: 'Modern SPA with TypeScript and TanStack Query' },
  { name: 'MapLibre GL', role: 'WebGL map rendering for route visualization' },
  { name: 'Recharts', role: 'Responsive data visualization charts' },
  { name: 'Tailwind CSS', role: 'Utility-first styling with dark theme' },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20">
      {/* Hero */}
      <section className="text-center pt-12">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6"
          style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Transjakarta
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Network Intelligence Pipeline — transforming raw GTFS feed data into actionable insights for Jakarta's bus rapid transit system.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity size={14} className="text-emerald-400" /> Live Data
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Lock size={14} className="text-blue-400" /> Secure API
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Layers size={14} className="text-amber-400" /> 4-Schema
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Tech Stack</h2>
        <div className="space-y-2">
          {TECH.map((t) => (
            <div key={t.name} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
