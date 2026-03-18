import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export default function ConnectionDot() {
  const connected = useConnectionStatus();
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
      <span className="text-white/50">{connected ? '연결됨' : '재연결 중...'}</span>
    </div>
  );
}
