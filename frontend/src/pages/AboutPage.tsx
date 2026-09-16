import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Database, Shield, GitBranch, BarChart3, Map, Zap, Layers, Lock, Activity } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';

const FEATURES = [
  { icon: Database, title: 'GTFS Pipeline', desc: 'Automated extract, load, and transform of Transjakarta GTFS data' },
  { icon: GitBranch, title: 'CDC Diff Engine', desc: 'Change detection between feed versions with before/after tracking' },
  { icon: BarChart3, title: 'Analytics Marts', desc: 'Headway analysis, coverage metrics, and service span calculations' },
  { icon: Map, title: 'Interactive Map', desc: 'All 240+ routes visualized with real-time stop data on MapLibre GL' },
  { icon: Shield, title: 'Security First', desc: 'Read-only API, rate limiting, input validation, and role-based access' },
  { icon: Zap, title: 'Real-time API', desc: 'FastAPI-powered REST endpoints with pagination and filtering' },
];

const TECH_STACK = [
  { name: 'PostgreSQL', role: 'Primary database with 4-schema architecture' },
  { name: 'PostGIS', role: 'Spatial extensions for geographic queries' },
  { name: 'Python', role: 'ETL pipeline, CDC engine, and API layer' },
  { name: 'FastAPI', role: 'High-performance async REST API' },
  { name: 'React', role: 'Modern SPA with TypeScript and TanStack Query' },
  { name: 'MapLibre GL', role: 'WebGL map rendering for route visualization' },
  { name: 'Recharts', role: 'Responsive data visualization charts' },
  { name: 'Tailwind CSS', role: 'Utility-first styling with dark theme' },
];

const PRINCIPLES = [
  'Single Postgres engine for all layers — no distributed complexity',
  'Idempotent pipeline runs — safe to retry, no duplicates',
  'Schema-on-read raw layer — store first, structure later',
  'Read-only API with separate database roles',
  'Change data capture for network evolution tracking',
  'Modular architecture — extract, load, transform, serve independently',
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-24 pb-20">
      <section className="relative min-h-[70vh] flex items-center justify-center -mt-20">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            y: bgY,
            background: 'radial-gradient(ellipse at center, rgba(0,52,120,0.4) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 text-center">
          <AnimatedSection>
            <motion.div
              className="text-6xl sm:text-8xl font-black mb-6"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #003478 50%, #1A73E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Transjakarta
            </motion.div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <p className="text-xl sm:text-2xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
              Network Intelligence Pipeline — transforming raw GTFS feed data into actionable
              insights for Jakarta's bus rapid transit system.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Activity size={14} className="text-[#10B981]" />
                <span>Live Data</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#64748B]" />
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Lock size={14} className="text-[#003478]" />
                <span>Secure API</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#64748B]" />
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Layers size={14} className="text-[#F59E0B]" />
                <span>4-Schema Architecture</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section>
        <AnimatedSection>
          <h2 className="text-3xl font-bold gradient-text mb-8">Features</h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <AnimatedSection key={feat.title} delay={i * 0.08}>
                <div className="glass rounded-2xl p-6 hover:bg-[rgba(30,41,59,0.6)] transition-all duration-300
                  group h-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(0,52,120,0.15)]
                    mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Icon size={22} className="text-[#003478]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{feat.desc}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      <section>
        <AnimatedSection>
          <h2 className="text-3xl font-bold gradient-text mb-8">Tech Stack</h2>
        </AnimatedSection>
        <div className="space-y-3">
          {TECH_STACK.map((tech, i) => (
            <AnimatedSection key={tech.name} delay={i * 0.06}>
              <div className="glass rounded-xl p-4 flex items-center gap-4
                hover:bg-[rgba(30,41,59,0.6)] transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-[rgba(0,52,120,0.15)] flex items-center
                  justify-center text-sm font-bold text-[#003478] shrink-0">
                  {tech.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{tech.name}</div>
                  <div className="text-xs text-[#64748B]">{tech.role}</div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section>
        <AnimatedSection>
          <h2 className="text-3xl font-bold gradient-text mb-8">Architecture Principles</h2>
        </AnimatedSection>
        <div className="glass rounded-2xl p-6">
          <div className="space-y-4">
            {PRINCIPLES.map((p, i) => (
              <AnimatedSection key={i} delay={i * 0.06}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#003478] text-white
                    text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{p}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
