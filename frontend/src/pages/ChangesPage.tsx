import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import LoadingState from '../components/LoadingState';
import { Plus, Minus, Pencil } from 'lucide-react';

const CHANGE_ICONS = {
  ADDED: <Plus size={14} />,
  REMOVED: <Minus size={14} />,
  MODIFIED: <Pencil size={14} />,
};

const CHANGE_COLORS = {
  ADDED: { bg: '#2E7D3215', text: '#2E7D32', border: '#2E7D32' },
  REMOVED: { bg: '#C6282815', text: '#C62828', border: '#C62828' },
  MODIFIED: { bg: '#E6510015', text: '#E65100', border: '#E65100' },
};

export default function ChangesPage() {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['feed-versions'],
    queryFn: () => api.getFeedVersions(),
  });

  const { data: changes, isLoading: changesLoading } = useQuery({
    queryKey: ['changes', selectedVersion],
    queryFn: () => selectedVersion ? api.getFeedVersionChanges(selectedVersion) : null,
    enabled: !!selectedVersion,
  });

  const versionList = Array.isArray(versions) ? versions : [];
  const changeData = changes as { route_changes: Record<string, unknown>[]; stop_changes: Record<string, unknown>[]; schedule_changes: Record<string, unknown>[] } | null;

  interface ChangeItem {
    change_id: number;
    feed_version_id: number;
    prev_version_id: number | null;
    route_id?: string;
    stop_id?: string;
    trip_id?: string;
    change_type: string;
    field_changed: string | null;
    old_value: string | null;
    new_value: string | null;
    detected_at: string;
    entity_type: 'Route' | 'Stop' | 'Schedule';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allChanges: ChangeItem[] = changeData
    ? [
        ...changeData.route_changes.map((c: any) => ({ ...c, entity_type: 'Route' })),
        ...changeData.stop_changes.map((c: any) => ({ ...c, entity_type: 'Stop' })),
        ...changeData.schedule_changes.map((c: any) => ({ ...c, entity_type: 'Schedule' })),
      ]
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Feed Changes</h1>
        <p className="text-sm text-[#6B7280] mt-1">Track network changes between GTFS feed versions</p>
      </div>

      {/* Version Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[#6B7280]">Select version:</label>
        <select
          value={selectedVersion || ''}
          onChange={(e) => setSelectedVersion(Number(e.target.value) || null)}
          className="px-3 py-2 bg-white border border-[#E8EAED] rounded-xl text-sm focus:outline-none focus:border-[#003478] transition-colors min-w-[200px]"
        >
          <option value="">Choose a version...</option>
          {versionList.map((v: Record<string, unknown>) => (
            <option key={v.feed_version_id as number} value={v.feed_version_id as number}>
              Version {String(v.feed_version_id)} — {new Date(String(v.fetch_timestamp)).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {versionsLoading ? (
        <LoadingState message="Loading versions..." />
      ) : changesLoading ? (
        <LoadingState message="Loading changes..." />
      ) : !selectedVersion ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EAED]">
          <p className="text-[#6B7280]">Select a feed version to view changes</p>
        </div>
      ) : allChanges.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EAED]">
          <p className="text-[#6B7280]">No changes detected for this version</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {(['ADDED', 'REMOVED', 'MODIFIED'] as const).map((type) => {
              const count = allChanges.filter((c) => c.change_type === type).length;
              const colors = CHANGE_COLORS[type];
              return (
                <div key={type} className="bg-white rounded-xl p-4 border border-[#E8EAED]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {CHANGE_ICONS[type]}
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text }}>{type}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A2E]">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Change Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allChanges.map((change, i) => {
              const colors = CHANGE_COLORS[change.change_type as keyof typeof CHANGE_COLORS];
              const entityId = change.route_id || change.stop_id || change.trip_id;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 border border-[#E8EAED] hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {CHANGE_ICONS[change.change_type as keyof typeof CHANGE_ICONS]}
                      </div>
                      <span className="text-xs font-semibold uppercase" style={{ color: colors.text }}>
                        {change.change_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280] bg-[#F8F9FA] px-2 py-0.5 rounded-full">
                      {change.entity_type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1A1A2E] mb-1">{entityId as string}</p>
                  {change.field_changed && (
                    <p className="text-xs text-[#6B7280]">
                      <span className="font-medium">{change.field_changed}</span>
                      {change.old_value && change.new_value && (
                        <span>
                          {' '}: <span className="line-through text-[#C62828]">{change.old_value}</span>
                          {' → '}<span className="text-[#2E7D32]">{change.new_value}</span>
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-[10px] text-[#6B7280] mt-2">
                    {new Date(change.detected_at as string).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
