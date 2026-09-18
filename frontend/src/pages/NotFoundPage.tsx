import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Compass size={44} className="mx-auto mb-5 text-ink-dim opacity-40" />
        <p className="font-display text-6xl font-bold text-ink mb-3">404</p>
        <p className="text-sm text-ink-muted mb-8">That stop isn’t on this route.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-beige/15 text-beige text-sm font-medium border border-beige/25 hover:bg-beige/25 transition-colors"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );
}