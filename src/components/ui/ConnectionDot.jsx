import { useConnectionStatus } from '@/hooks/useConnectionStatus';

export default function ConnectionDot() {
  const { connected } = useConnectionStatus();
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
      <span className="text-slate-400">{connected ? '연결됨' : '재연결 중...'}</span>
    </div>
  );
}
