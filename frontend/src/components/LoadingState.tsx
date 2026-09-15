import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-[#003478] animate-spin" />
      <p className="text-sm text-[#6B7280]">{message}</p>
    </div>
  );
}
