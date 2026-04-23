import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { getServerNow } from '@/features/timer/api/useTimer';

function getColor(secondsLeft, totalSeconds) {
  const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  // Functional urgency colors — Tailwind classes for dark mode support
  if (ratio > 0.5) return { bar: 'bg-slate-900 dark:bg-slate-200', bg: 'bg-white dark:bg-slate-800', text: 'text-slate-900 dark:text-slate-100' };
  if (ratio > 0.2) return { bar: 'bg-amber-500', bg: 'bg-white dark:bg-slate-800', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-red-500', bg: 'bg-white dark:bg-slate-800', text: 'text-red-500 dark:text-red-400' };
}

function formatTime(seconds) {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return `${seconds}초`;
}

/**
 * Horizontal countdown bar for student vote page.
 * Shows remaining time with progress bar + color transitions.
 * Pulses in final 5 seconds.
 */
export default function TimerCountdown({ endTime, duration, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    if (!endTime) return;

    function tick() {
      // 서버 시간 기준 remaining — 학생 기기 시계 편차 보정 (endTime은 서버 기준으로 저장됨)
      const remaining = Math.max(0, Math.ceil((endTime - getServerNow()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        onExpire?.();
      }
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const progress = duration > 0 ? secondsLeft / duration : 0;
  const color = getColor(secondsLeft, duration);
  const isPulsing = secondsLeft <= 5 && secondsLeft > 0;
  const isUrgent = secondsLeft <= 3 && secondsLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl px-4 py-3 shadow-sm ${color.bg} transition-colors duration-300`}
    >
      <motion.div
        animate={isUrgent ? { x: [0, -3, 3, -2, 2, 0], scale: [1, 1.04, 1] } : isPulsing ? { scale: [1, 1.03, 1] } : {}}
        transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : isPulsing ? { repeat: Infinity, duration: 0.6 } : {}}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={`${color.text} transition-colors duration-300`} />
            <span className={`text-xs font-medium ${color.text} transition-colors duration-300`}>
              남은 시간
            </span>
          </div>
          <motion.span
            key={secondsLeft}
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-sm font-bold tabular-nums ${color.text} transition-colors duration-300`}
          >
            {formatTime(secondsLeft)}
          </motion.span>
        </div>
        <div className="h-1.5 bg-slate-200/60 dark:bg-slate-600/60 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color.bar}`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
