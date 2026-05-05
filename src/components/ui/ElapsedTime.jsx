import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}

/**
 * Displays elapsed lecture time since session started.
 * Updates every 30 seconds. Shows nothing until at least 1 minute has passed.
 */
export default function ElapsedTime({ startedAt, status, className = '' }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || status !== 'active') return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [startedAt, status]);

  if (!startedAt || status !== 'active') return null;

  const elapsed = Math.max(0, now - startedAt);
  if (elapsed < 60_000) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 ${className}`}>
      <Clock size={11} />
      <span className="tabular-nums">{formatElapsed(elapsed)}</span>
    </span>
  );
}
