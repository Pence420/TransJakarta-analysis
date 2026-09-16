import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Plus, Minus, Edit3, Calendar } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api/client';

const TYPE_CONFIG = {
  ADDED: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: Plus, label: 'Added' },
  REMOVED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: Minus, label: 'Removed' },
  MODIFIED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Edit3, label: 'Modified' },
};

export default function ChangesPage() {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [changeFilter, setChangeFilter] = useState<string>('');

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['feed-versions'],
    queryFn: () => api.getFeedVersions(),
  });

  const { data: changes, isLoading: changesLoading, error, refetch } = useQuery({
    queryKey: ['changes', selectedVersion, changeFilter],
    queryFn: () => selectedVersion
      ? api.getFeedVersionChanges(selectedVersion, changeFilter || undefined)
      : Promise.resolve(null),
    enabled: !!selectedVersion,
  });

  const allChanges = changes
    ? [
        ...changes.route_changes.map((c) => ({ ...c, entity_type: 'route' as const })),
        ...changes.stop_changes.map((c) => ({ ...c, entity_type: 'stop' as const })),
        ...changes.schedule_changes.map((c) => ({ ...c, entity_type: 'schedule' as const })),
      ].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    : [];

  const filteredChanges = changeFilter
    ? allChanges.filter((c) => c.change_type === changeFilter)
    : allChanges;

  const added = allChanges.filter((c) => c.change_type === 'ADDED').length;
  const removed = allChanges.filter((c) => c.change_type === 'REMOVED').length;
  const modified = allChanges.filter((c) => c.change_type === 'MODIFIED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AnimatedSection>
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Network Changes</h1>
          <p className="text-sm text-[#64748B]">Track what changed between GTFS feed versions</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AnimatedSection delay={0}>
          <select
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white
              focus:outline-none focus:border-[#003478] transition-colors"
            value={selectedVersion ?? ''}
            onChange={(e) => setSelectedVersion(Number(e.target.value) || null)}
          >
            <option value="">Select a version...</option>
            {versions?.map((v) => (
              <option key={v.feed_version_id} value={v.feed_version_id}>
                Version {v.feed_version_id} — {new Date(v.fetch_timestamp).toLocaleDateString()}
              </option>
            ))}
          </select>
        </AnimatedSection>

        {selectedVersion && (
          <AnimatedSection delay={0.05}>
            <div className="flex gap-2">
              {(['', 'ADDED', 'REMOVED', 'MODIFIED'] as const).map((type) => {
                const config = type ? TYPE_CONFIG[type] : null;
                return (
                  <button
                    key={type}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                      ${changeFilter === type
                        ? 'bg-[#003478] text-white'
                        : 'glass text-[#94A3B8] hover:text-white'
                      }`}
                    onClick={() => setChangeFilter(type)}
                  >
                    {config?.label ?? 'All'}
                  </button>
                );
              })}
            </div>
          </AnimatedSection>
        )}
      </div>

      {versionsLoading && <LoadingState message="Loading versions..." />}

      {!versionsLoading && !selectedVersion && (
        <AnimatedSection delay={0.1}>
          <div className="text-center py-20 text-[#64748B]">
            <GitBranch size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a feed version to see changes</p>
          </div>
        </AnimatedSection>
      )}

      {!versionsLoading && selectedVersion && changesLoading && (
        <LoadingState message="Loading changes..." />
      )}

      {!versionsLoading && selectedVersion && error && (
        <ErrorState message="Failed to load changes" onRetry={() => refetch()} />
      )}

      {!versionsLoading && selectedVersion && !changesLoading && !error && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Added" value={added} icon={Plus} color="#10B981" index={0} />
            <MetricCard label="Removed" value={removed} icon={Minus} color="#EF4444" index={1} />
            <MetricCard label="Modified" value={modified} icon={Edit3} color="#F59E0B" index={2} />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {filteredChanges.length === 0 ? (
                <motion.div
                  className="text-center py-12 text-[#64748B]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No changes detected for this version
                </motion.div>
              ) : (
                filteredChanges.map((change, i) => {
                  const config = TYPE_CONFIG[change.change_type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={`${change.entity_type}-${change.change_id}`}
                      className="glass rounded-xl p-4 hover:bg-[rgba(30,41,59,0.6)] transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                          style={{ backgroundColor: config.bg }}
                        >
                          <Icon size={14} style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: config.bg, color: config.color }}
                            >
                              {config.label}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-[rgba(255,255,255,0.05)] text-[#94A3B8]">
                              {change.entity_type}
                            </span>
                          </div>
                          <div className="text-sm text-white font-medium">
                            {change.route_id || change.stop_id || change.trip_id || '—'}
                          </div>
                          {change.field_changed && (
                            <div className="text-xs text-[#64748B] mt-1">
                              <span>{change.field_changed}: </span>
                              {change.old_value && (
                                <span className="line-through text-[#EF4444]/60">{change.old_value}</span>
                              )}
                              {change.old_value && change.new_value && (
                                <span className="mx-1">→</span>
                              )}
                              {change.new_value && (
                                <span className="text-[#10B981]">{change.new_value}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1.5">
                            <Calendar size={10} />
                            {new Date(change.detected_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
