import { useQuery } from '@tanstack/react-query';
import {
  Activity, ArrowDown, ArrowRight, BarChart3, Braces, Check, Database,
  FileSearch, GitCompareArrows, Layers3, Map, Radio, Route, Server, ShieldCheck,
  Sparkles, Waypoints,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';

const PRINCIPLES = [
  ['01', 'Observable by default', 'Every feed transition stays inspectable, measurable, and easy to explain.'],
  ['02', 'Geography stays truthful', 'Routes and stops keep their real Jakarta coordinates from source to screen.'],
  ['03', 'Safe to explore', 'Read-only serving and constrained queries protect the operational data layer.'],
  ['04', 'Built for change', 'Versioned feeds and CDC make network evolution part of the product, not an afterthought.'],
];

export default function AboutPage() {
  const routes = useQuery({ queryKey: ['about-routes-count'], queryFn: () => api.getRoutes(1, 0) });
  const stops = useQuery({ queryKey: ['about-stops-count'], queryFn: () => api.getStops(1, 0) });
  const versions = useQuery({ queryKey: ['about-feed-versions'], queryFn: () => api.getFeedVersions() });

  const proof = [
    { value: routes.data ? formatNumber(routes.data.total) : '—', label: 'mapped corridors' },
    { value: stops.data ? formatNumber(stops.data.total) : '—', label: 'network stops' },
    { value: versions.data ? formatNumber(versions.data.length) : '—', label: 'feed snapshots' },
    { value: '04', label: 'data layers' },
  ];

  return (
    <div className="about-landing pb-10">
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="about-eyebrow"><span className="pulse-dot" /> Jakarta transit, made legible</div>
          <h1>From raw schedules to a <em>living network view.</em></h1>
          <p>Transjakarta Network Intelligence connects GTFS ingestion, version history, spatial data, and operational analytics in one focused workspace.</p>
          <div className="about-hero-signals">
            <span><Check size={13} /> Real route geometry</span>
            <span><Check size={13} /> Read-only serving</span>
            <span><Check size={13} /> Change-aware data</span>
          </div>
        </div>

        <div className="about-network-visual" aria-label="Network data flow illustration">
          <div className="network-orbit network-orbit-one" />
          <div className="network-orbit network-orbit-two" />
          <div className="network-core"><Route size={25} /><strong>TJ</strong><span>Network core</span></div>
          <div className="network-node node-feed"><Radio size={15} /><span>GTFS</span></div>
          <div className="network-node node-spatial"><Map size={15} /><span>Spatial</span></div>
          <div className="network-node node-cdc"><GitCompareArrows size={15} /><span>CDC</span></div>
          <div className="network-node node-api"><Braces size={15} /><span>API</span></div>
          <svg className="network-lines" viewBox="0 0 520 430" aria-hidden="true">
            <path d="M90 88 C150 110 175 155 240 210" />
            <path d="M420 88 C350 115 330 165 280 210" />
            <path d="M92 348 C160 320 178 270 240 230" />
            <path d="M426 346 C350 320 330 270 280 230" />
          </svg>
          <div className="network-live"><span /> PIPELINE HEALTHY</div>
        </div>
      </section>

      <section className="about-proof" aria-label="Live network facts">
        {proof.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
      </section>

      <section className="about-section-head">
        <div><p className="page-kicker">One operating picture</p><h2>Designed around the questions operators actually ask.</h2></div>
        <p>Not another pile of disconnected charts. Every surface follows the same network—from where a corridor runs to how its service changes over time.</p>
      </section>

      <section className="about-bento">
        <article className="about-feature about-feature-map">
          <div className="feature-copy"><span className="feature-number">01 / GEOGRAPHY</span><h3>See the network in its real place.</h3><p>True GTFS shapes, directional routes, stop-level detail, and native map gestures keep the picture grounded in Jakarta.</p></div>
          <div className="mini-map" aria-hidden="true">
            <div className="mini-road road-a" /><div className="mini-road road-b" /><div className="mini-road road-c" />
            <svg viewBox="0 0 500 240"><path d="M-20 215 C95 170 100 80 205 105 S315 205 535 20" /><path className="return" d="M-10 228 C105 184 110 94 211 118 S325 216 545 32" /></svg>
            <i className="stop-one" /><i className="stop-two" /><i className="stop-three" /><i className="stop-four" />
            <span className="map-tag"><Map size={12} /> Live corridor geometry</span>
          </div>
        </article>

        <article className="about-feature about-feature-change">
          <span className="feature-icon"><GitCompareArrows size={18} /></span>
          <span className="feature-number">02 / CHANGE</span>
          <h3>Know what moved between feeds.</h3>
          <p>CDC preserves additions, removals, and modified records so each release has an explainable before and after.</p>
          <div className="change-stack"><span><i className="add" /> Added stop <b>+18</b></span><span><i className="edit" /> Updated route <b>07</b></span><span><i className="remove" /> Removed trip <b>03</b></span></div>
        </article>

        <article className="about-feature about-feature-signal">
          <span className="feature-icon"><Activity size={18} /></span>
          <span className="feature-number">03 / OPERATIONS</span>
          <h3>Turn schedules into signals.</h3>
          <p>Headway rhythm, service span, coverage, and corridor activity become compact decisions—not spreadsheet archaeology.</p>
          <div className="signal-bars" aria-hidden="true">{[34, 51, 47, 68, 82, 58, 91, 73, 45, 62, 38, 56].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
        </article>

        <article className="about-feature about-feature-api">
          <div><span className="feature-number">04 / ACCESS</span><h3>A calm interface over a serious data system.</h3><p>FastAPI serves parameterized, paginated, read-only resources while the React workspace keeps exploration fast.</p></div>
          <div className="api-window"><div><span /><span /><span /></div><code><b>GET</b> /api/routes/13/map-data</code><code><b>200</b> geometry + stops</code></div>
        </article>
      </section>

      <section className="about-pipeline">
        <div className="pipeline-intro"><p className="page-kicker">Architecture</p><h2>One traceable path from source to screen.</h2><p>Each layer has a clear job, which keeps the system understandable when the network—or the product—changes.</p></div>
        <div className="pipeline-flow">
          <div className="pipeline-step"><span><FileSearch size={17} /></span><small>01 · ingest</small><strong>Official GTFS</strong><p>Scheduled service and geometry</p></div>
          <ArrowRight className="pipeline-arrow" size={18} /><ArrowDown className="pipeline-arrow-mobile" size={18} />
          <div className="pipeline-step"><span><Database size={17} /></span><small>02 · model</small><strong>Postgres + PostGIS</strong><p>Layered relational and spatial data</p></div>
          <ArrowRight className="pipeline-arrow" size={18} /><ArrowDown className="pipeline-arrow-mobile" size={18} />
          <div className="pipeline-step"><span><Server size={17} /></span><small>03 · serve</small><strong>FastAPI</strong><p>Constrained read-only endpoints</p></div>
          <ArrowRight className="pipeline-arrow" size={18} /><ArrowDown className="pipeline-arrow-mobile" size={18} />
          <div className="pipeline-step"><span><Layers3 size={17} /></span><small>04 · understand</small><strong>React workspace</strong><p>Maps, analytics, and feed history</p></div>
        </div>
      </section>

      <section className="about-principles">
        <div className="principles-title"><span className="feature-icon"><Sparkles size={18} /></span><p className="page-kicker">Product principles</p><h2>Useful intelligence is clear, honest, and resilient.</h2></div>
        <div className="principles-list">
          {PRINCIPLES.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><Waypoints size={16} /></article>)}
        </div>
      </section>

      <footer className="about-footer"><div><ShieldCheck size={18} /><span>Built for dependable, read-only exploration</span></div><div><BarChart3 size={18} /><span>Transjakarta Network Intelligence</span></div></footer>
    </div>
  );
}
