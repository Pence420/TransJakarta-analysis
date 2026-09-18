import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Plus, Minus, Edit3, Calendar, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDate } from '../lib/format';
import PageTitle from '../components/PageTitle';
import { Spinner, ErrorState } from '../components/LoadingState';
import type { Change, ChangeType, FeedVersion } from '../lib/types';

const STATUS: Record<ChangeType, { color: string; bg: string; icon: typeof Plus; label: string }> = {
  ADDED:    { color: '#6d9c7b', bg: 'rgba(109,156,123,0.12)', icon: Plus,   label: 'Added'    },
  REMOVED:  { color: '#e8696b', bg: 'rgba(232,105,107,0.12)', icon: Minus,  label: 'Removed'  },
  MODIFIED: { color: '#d9a24f', bg: 'rgba(217,162,79,0.12)',  icon: Edit3,  label: 'Modified' },
};

const BADGE = 'px-2 py-0.5 rounded text-[11px] font-medium';

function ChangeCard({ change, type }: { change: Change; type: string }) {
  const s = STATUS[change.change_type];
  const Icon = s.icon;
  return (
    <div className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-colors flex gap-3 animate-fade-up">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: s.bg }}>
        <Icon size={15} style={{ color: s.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={BADGE} style={{ background: s.bg, color: s.color }}>{s.label}</span>
          <span className={`${BADGE} bg-white/[0.05] text-ink-dim`}>{type}</span>
        </div>
        <p className="text-sm text-ink font-medium">
          {change.route_id ?? change.stop_id ?? change.trip_id ?? '—'}
        </p>
        {change.field_changed && (
          <p className="text-xs text-ink-muted mt-1.5">
            <span className="text-ink-dim">{change.field_changed}:</span>{' '}
            {change.old_value && <span className="line-through text-crimson/70 mr-1">{change.old_value}</span>}
            {change.old_value && change.new_value && <span className="mx-0.5">→</span>}
            {change.new_value && <span className="text-sage">{change.new_value}</span>}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-dim mt-2">
          <Calendar size={11} />
          <span>{fmtDate(change.detected_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChangesPage() {
  const [version, setVersion] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChangeType | ''>('');

  const versions = useQuery({ queryKey: ['feed-versions'], queryFn: () => api.getFeedVersions() });

  const changes = useQuery({
    queryKey: ['changes', version, filter],
    queryFn: () => (version ? api.getFeedVersionChanges(version, filter || undefined) : Promise.resolve(null)),
    enabled: !!version,
  });

  const latestVersion: FeedVersion | undefined = versions.data?.[0];

  if (versions.isLoading) return <Spinner />;
  if (versions.error) return <ErrorState message="Failed to load feed versions" onRetry={() => versions.refetch()} />;

  const all: Change[] = changes.data
    ? [
        ...changes.data.route_changes.map((c) => ({ ...c, entity_type: 'route' as const })),
        ...changes.data.stop_changes.map((c) => ({ ...c, entity_type: 'stop' as const })),
        ...changes.data.schedule_changes.map((c) => ({ ...c, entity_type: 'schedule' as const })),
      ].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    : [];

  const filtered = filter ? all.filter((c) => c.change_type === filter) : all;
  const added = all.filter((c) => c.change_type === 'ADDED').length;
  const removed = all.filter((c) => c.change_type === 'REMOVED').length;
  const modified = all.filter((c) => c.change_type === 'MODIFIED').length;

  const handleVersionChange = (val: string) => {
    const n = Number(val);
    setVersion(n || null);
    setFilter('');
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Feed Changes"
        subtitle="Track network deltas between GTFS feed versions — routes added, stops modified, schedules revised."
        trailing={
          <div className="flex items-center gap-3">
            {latestVersion && (
              <span className="text-[11px] text-ink-dim uppercase tracking-wider">
                Latest v{latestVersion.feed_version_id}
              </span>
            )}
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="glass rounded-xl p-3 flex-1">
          <div className="text-[11px] text-ink-dim uppercase tracking-wider mb-1">Feed version</div>
          <select
            value={version ?? ''}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="w-full bg-transparent text-sm text-ink focus:outline-none"
          >
            <option value="">Select a version…</option>
            {versions.data?.map((v) => (
              <option key={v.feed_version_id} value={v.feed_version_id}>
                Version {v.feed_version_id} — {fmtDate(v.fetch_timestamp)}
              </option>
            ))}
          </select>
        </div>
        {version && (
          <div className="glass rounded-xl p-3 flex gap-2 items-start">
            <span className="text-[11px] text-ink-dim uppercase tracking-wider mb-1 w-full sm:w-auto">Filter</span>
            {(['', 'ADDED', 'REMOVED', 'MODIFIED'] as const).map((t) => {
              const s = t ? STATUS[t] : null;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    filter === t
                      ? 'bg-beige/15 text-beige border border-beige/30'
                      : 'glass text-ink-dim hover:text-ink border border-transparent'
                  }`}
                >
                  {s?.label ?? 'All'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!version && (
        <div className="text-center py-20">
          <GitBranch size={44} className="mx-auto mb-4 text-ink-dim opacity-25" />
          <p className="text-sm text-ink-muted">Select a feed version above to inspect changes.</p>
        </div>
      )}

      {version && changes.isLoading && <Spinner />}
      {version && changes.error && <ErrorState message="Failed to load changes" onRetry={() => changes.refetch()} />}

      {version && !changes.isLoading && !changes.error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { type: 'ADDED' as const, count: added },
              { type: 'REMOVED' as const, count: removed },
              { type: 'MODIFIED' as const, count: modified },
            ]).map(({ type, count }) => {
              const s = STATUS[type];
              const Icon = s.icon;
              return (
                <div key={type} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-dim uppercase tracking-wider">{s.label}</p>
                    <p className="text-xl font-semibold font-display text-ink">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-sm text-ink-muted">
                <FileText size={36} className="mx-auto mb-3 opacity-25" />
                {filter ? `No ${filter.toLowerCase()} changes detected.` : 'No changes detected for this version.'}
              </div>
            )}
            {filtered.map((c) => (
              <ChangeCard key={`${c.entity_type}-${c.change_id}`} change={c} type={c.entity_type ?? 'change'} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}