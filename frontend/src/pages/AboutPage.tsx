import { Database, Map, BarChart3, GitBranch, Clock, Shield } from 'lucide-react';

const features = [
  { icon: Database, title: 'ELT Pipeline', desc: 'Postgres-based with raw → staging → marts layers' },
  { icon: GitBranch, title: 'CDC Diff Engine', desc: 'Track network changes between GTFS feed versions' },
  { icon: Map, title: 'Interactive Map', desc: 'MapLibre GL for route visualization with stop markers' },
  { icon: BarChart3, title: 'Analytics', desc: 'Headway analysis, coverage by zone, service span' },
  { icon: Clock, title: 'Orchestration', desc: 'Automated pipeline with cron scheduling' },
  { icon: Shield, title: 'Security', desc: 'Read-only API with role-based access control' },
];

const techStack = [
  { name: 'Postgres + PostGIS', role: 'Database & Spatial' },
  { name: 'Python', role: 'ETL Scripts' },
  { name: 'FastAPI', role: 'API Layer' },
  { name: 'React + Vite', role: 'Frontend' },
  { name: 'MapLibre GL JS', role: 'Map Rendering' },
  { name: 'Recharts', role: 'Data Visualization' },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">About</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Transjakarta Network Intelligence Pipeline — a data engineering project
        </p>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#003478] to-[#1A73E8] rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-2">Transjakarta GTFS Pipeline</h2>
        <p className="text-sm text-white/80 leading-relaxed">
          Mengolah data GTFS Transjakarta menjadi insight jaringan transportasi publik Jakarta:
          coverage wilayah, frekuensi layanan (headway), jam operasional, dan historical diff
          perubahan jaringan antar versi feed GTFS.
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-4 border border-[#E8EAED] hover:shadow-md transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-[#00347815] flex items-center justify-center mb-3">
                <f.icon size={18} className="text-[#003478]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-1">{f.title}</h3>
              <p className="text-xs text-[#6B7280]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Tech Stack</h2>
        <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
          {techStack.map((tech, i) => (
            <div
              key={tech.name}
              className={`flex items-center justify-between px-4 py-3 ${
                i < techStack.length - 1 ? 'border-b border-[#E8EAED]' : ''
              }`}
            >
              <span className="text-sm font-medium text-[#1A1A2E]">{tech.name}</span>
              <span className="text-xs text-[#6B7280] bg-[#F8F9FA] px-2 py-0.5 rounded-full">{tech.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Principles */}
      <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-[#E8EAED]">
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-3">Architecture Principles</h2>
        <ul className="space-y-2 text-sm text-[#6B7280]">
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">1.</span> Choose common components wisely</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">2.</span> Plan for failure — idempotent loads, retry logic</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">3.</span> Architect for scalability — partitioning & indexing</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">4.</span> Architecture is leadership — decisions documented</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">5.</span> Always be architecting — extensible raw layer</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">6.</span> Build loosely coupled systems — modular pipeline</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">7.</span> Make reversible decisions — raw layer preserved</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">8.</span> Prioritize security — role-based access</li>
          <li className="flex items-start gap-2"><span className="text-[#003478] font-bold">9.</span> Embrace FinOps — retention policies</li>
        </ul>
      </div>
    </div>
  );
}
