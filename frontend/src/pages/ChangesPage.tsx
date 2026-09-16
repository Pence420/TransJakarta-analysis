import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Plus, Minus, Edit3, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import type { Change } from '../lib/types';

const TC = {
  ADDED: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', icon: Plus, label: 'Added' },
  REMOVED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: Minus, label: 'Removed' },
  MODIFIED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Edit3, label: 'Modified' },
};

export default function ChangesPage() {
  const [version, setVersion] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const { data: versions, isLoading: vLoading } = useQuery({
    queryKey: ['feed-versions'],
    queryFn: () => api.getFeedVersions(),
  });

  const { data: changes, isLoading: cLoading, error, refetch } = useQuery({
    queryKey: ['changes', version, filter],
    queryFn: () => version ? api.getFeedVersionChanges(version, filter || undefined) : Promise.resolve(null),
    enabled: !!version,
  });

  const all: Change[] = changes
    ? [
        ...changes.route_changes.map((c) => ({ ...c, entity_type: 'route' as const })),
        ...changes.stop_changes.map((c) => ({ ...c, entity_type: 'stop' as const })),
        ...changes.schedule_changes.map((c) => ({ ...c, entity_type: 'schedule' as const })),
      ].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    : [];

  const filtered = filter ? all.filter((c) => c.change_type === filter) : all;
  const added = all.filter((c) => c.change_type === 'ADDED').length;
  const removed = all.filter((c) => c.change_type === 'REMOVED').length;
  const modified = all.filter((c) => c.change_type === 'MODIFIED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Network Changes</h1>
        <p className="text-sm text-slate-400 mt-1">Track what changed between GTFS feed versions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="glass rounded-xl p-3 flex-1">
          <select
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            value={version ?? ''}
            onChange={(e) => setVersion(Number(e.target.value) || null)}
          >
            <option value="">Select a version...</option>
            {versions?.map((v) => (
              <option key={v.feed_version_id} value={v.feed_version_id}>
                Version {v.feed_version_id} — {new Date(v.fetch_timestamp).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        {version && (
          <div className="flex gap-2">
            {(['', 'ADDED', 'REMOVED', 'MODIFIED'] as const).map((t) => {
              const c = t ? TC[t] : null;
              return (
                <button key={t}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
                    ${filter === t ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'glass text-slate-400 hover:text-white border border-transparent'}`}
                  onClick={() => setFilter(t)}
                >
                  {c?.label ?? 'All'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {vLoading && <p className="text-sm text-slate-500 text-center py-12">Loading versions...</p>}

      {!vLoading && !version && (
        <div className="text-center py-20 text-slate-500">
          <GitBranch size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a feed version to see changes</p>
        </div>
      )}

      {!vLoading && version && cLoading && <p className="text-sm text-slate-500 text-center py-12">Loading changes...</p>}
      {!vLoading && version && error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-400 mb-2">Failed to load changes</p>
          <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!vLoading && version && !cLoading && !error && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: TC.ADDED.bg }}>
                  <Plus size={14} style={{ color: TC.ADDED.color }} />
                </div>
                <span className="text-xs text-slate-400">Added</span>
              </div>
              <p className="text-2xl font-bold text-white">{added}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: TC.REMOVED.bg }}>
                  <Minus size={14} style={{ color: TC.REMOVED.color }} />
                </div>
                <span className="text-xs text-slate-400">Removed</span>
              </div>
              <p className="text-2xl font-bold text-white">{removed}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: TC.MODIFIED.bg }}>
                  <Edit3 size={14} style={{ color: TC.MODIFIED.color }} />
                </div>
                <span className="text-xs text-slate-400">Modified</span>
              </div>
              <p className="text-2xl font-bold text-white">{modified}</p>
            </div>
          </div>

          {/* Change List */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-12">No changes detected for this version</p>
            )}
            {filtered.map((change) => {
              const c = TC[change.change_type];
              const Icon = c.icon;
              return (
                <div key={`${change.entity_type}-${change.change_id}`}
                  className="glass rounded-xl p-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: c.bg }}>
                      <Icon size={14} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{ background: c.bg, color: c.color }}>{c.label}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] bg-white/[0.04] text-slate-400">
                          {change.entity_type}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {change.route_id || change.stop_id || change.trip_id || '—'}
                      </p>
                      {change.field_changed && (
                        <p className="text-xs text-slate-400 mt-1">
                          {change.field_changed}: {change.old_value && <span className="line-through text-red-400/60">{change.old_value}</span>}
                          {change.old_value && change.new_value && <span className="mx-1">→</span>}
                          {change.new_value && <span className="text-emerald-400">{change.new_value}</span>}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
                        <Calendar size={10} />
                        {new Date(change.detected_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
