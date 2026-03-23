import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import BreakMascot from './BreakMascot';
import Button from '@/components/ui/Button';

const PRESETS = [
  { label: '5분', seconds: 300 },
  { label: '10분', seconds: 600 },
  { label: '15분', seconds: 900 },
  { label: '20분', seconds: 1200 },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * BreakTimer — 쉬는시간 타이머 with dancing mascot.
 * Large countdown display + animated mascot.
 */
export default function BreakTimer() {
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, remaining]);

  function start(seconds) {
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setRemaining(0);
    setTotalSeconds(null);
  }

  const progress = totalSeconds ? remaining / totalSeconds : 0;
  const isFinished = totalSeconds && remaining === 0 && !running;

  // Not started — show preset buttons
  if (!totalSeconds) {
    return (
      <div className="flex flex-col items-center gap-8" onClick={e => e.stopPropagation()}>
        <BreakMascot size={120} />
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">쉬는 시간</h3>
        <div className="flex gap-3">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.seconds}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
              whileTap={{ scale: 0.93 }}
              whileHover={{ y: -2 }}
              onClick={() => start(p.seconds)}
              className="px-6 py-3 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-base tracking-tight hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150"
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Finished
  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <BreakMascot size={120} />
        </motion.div>
        <motion.h3
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          쉬는 시간 끝!
        </motion.h3>
        <Button onClick={stop} variant="primary" size="lg">돌아가기</Button>
      </div>
    );
  }

  // Running
  return (
    <div className="flex flex-col items-center gap-8" onClick={e => e.stopPropagation()}>
      {/* Animated mascot — cycles through idle/dance/walk/stretch/wave */}
      <BreakMascot size={140} />

      {/* Big countdown */}
      <div className="text-center">
        <motion.p
          key={remaining}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="text-7xl md:text-8xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
        >
          {formatTime(remaining)}
        </motion.p>
        <p className="text-slate-400 text-sm mt-2">쉬는 시간</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <Button onClick={stop} variant="secondary" size="md">중단</Button>
    </div>
  );
}
