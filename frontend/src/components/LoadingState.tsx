export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-beige animate-spin" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="w-24 h-3 rounded bg-white/[0.06] animate-pulse" />
      <div className="w-40 h-6 rounded bg-white/[0.06] animate-pulse" />
      <div className="w-full h-44 rounded-xl bg-white/[0.04] animate-pulse" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="glass rounded-2xl flex flex-col items-center justify-center py-14 px-6 text-center">
      <p className="text-sm text-crimson mb-1.5">{message ?? 'Failed to load data'}</p>
      <p className="text-xs text-ink-muted mb-4">The API may be offline or the query failed.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-xs font-medium text-ink bg-white/[0.05] border border-white/10 hover:border-beige/40 hover:text-beige transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}