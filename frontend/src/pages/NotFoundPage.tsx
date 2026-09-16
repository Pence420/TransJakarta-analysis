import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-8xl font-bold text-white mb-4">404</p>
        <p className="text-lg text-slate-400 mb-8">Page not found</p>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 transition-colors"
          onClick={() => navigate('/')}
        >
          <Home size={16} /> Back to Routes
        </button>
      </div>
    </div>
  );
}
