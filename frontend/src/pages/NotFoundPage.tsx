import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="glass rounded-[1.5rem] flex items-center justify-center min-h-[60vh]">
      <div className="text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-beige/[0.08] ring-1 ring-beige/10 flex items-center justify-center mx-auto mb-5">
          <Compass size={24} className="text-beige" />
        </div>
        <p className="font-display text-7xl font-semibold tracking-[-0.08em] text-ink mb-3">404</p>
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
