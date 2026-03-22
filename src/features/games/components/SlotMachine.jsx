import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));

/**
 * SlotMachine — 777 style name slot game.
 * 3 reels show cycling names then stop one by one.
 * Guaranteed win within 1-6 spins.
 */
export default function SlotMachine({ participants, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState([null, null, null]);
  const [stopped, setStopped] = useState([false, false, false]);
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const guaranteedWinner = useRef(null);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const names = useMemo(() => participants.map(p => p.nickname), [participants]);

  function pickRandom() {
    return names[Math.floor(Math.random() * names.length)];
  }

  // Prevent re-render loops — memoize stable reference
  const namesRef = useRef(names);
  namesRef.current = names;

  function spin() {
    if (spinning || names.length === 0) return;
    timersRef.current.forEach(clearTimeout);

    const next = spinCount + 1;
    setSpinCount(next);
    setSpinning(true);
    setWinner(null);
    setStopped([false, false, false]);
    setResults([null, null, null]);

    if (!guaranteedWinner.current) {
      guaranteedWinner.current = pickRandom();
    }

    // Win probability increases each spin
    const winChance = [0.2, 0.3, 0.5, 0.7, 0.9, 1.0][Math.min(next - 1, 5)];
    const shouldWin = Math.random() < winChance;

    let r1, r2, r3;
    if (shouldWin) {
      r1 = r2 = r3 = guaranteedWinner.current;
    } else {
      r1 = pickRandom();
      r2 = Math.random() < 0.4 ? r1 : pickRandom(); // near miss
      r3 = pickRandom();
      while (r1 === r2 && r2 === r3) r3 = pickRandom();
    }

    // Stop reels one by one — NO setInterval, just timeouts
    timersRef.current[0] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults(prev => [r1, prev[1], prev[2]]);
      setStopped(prev => [true, prev[1], prev[2]]);
    }, 1200);

    timersRef.current[1] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults(prev => [prev[0], r2, prev[2]]);
      setStopped(prev => [prev[0], true, prev[2]]);
    }, 2000);

    timersRef.current[2] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults([r1, r2, r3]);
      setStopped([true, true, true]);
      setSpinning(false);

      if (r1 === r2 && r2 === r3) {
        hapticSuccess();
        setWinner(r1);
        guaranteedWinner.current = null;
        setSpinCount(0);
        onResult?.(r1);
      }
    }, 2800);
  }

  function reset() {
    setWinner(null);
    setResults([null, null, null]);
    setStopped([false, false, false]);
    guaranteedWinner.current = null;
    setSpinCount(0);
  }

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Sparkles size={36} className="text-slate-400" />
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">777 슬롯</h3>
        <p className="text-slate-400 text-sm">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  const isMatch = results[0] && results[0] === results[1] && results[1] === results[2];

  return (
    <div className="flex flex-col items-center gap-8">
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">777 슬롯</h3>

      {/* 3 Reels */}
      <div className="flex gap-3 justify-center">
        {[0, 1, 2].map((idx) => {
          const isReelStopped = stopped[idx];
          const name = results[idx];

          return (
            <div
              key={idx}
              className={`w-24 h-28 rounded-2xl flex flex-col items-center justify-center gap-1 overflow-hidden ${
                isReelStopped && isMatch
                  ? 'bg-slate-900 dark:bg-slate-100 shadow-lg'
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600'
              } transition-colors duration-300`}
            >
              {spinning && !isReelStopped ? (
                // CSS-only cycling animation — no state updates
                <div className="animate-slot-cycle flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse" />
                  <span className="text-[10px] text-slate-400 animate-pulse">...</span>
                </div>
              ) : name ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Avatar name={name} size="md" />
                  <span className={`text-xs font-bold truncate max-w-[80px] ${
                    isMatch ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-200'
                  }`}>{name}</span>
                </motion.div>
              ) : (
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">?</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Winner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-center space-y-3"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{winner}</div>
            <span className="inline-flex items-center px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-sm font-bold">
              777 당첨!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        <Button onClick={spin} variant="primary" size="lg" disabled={spinning}>
          {spinning ? '돌리는 중...' : winner ? '다시 돌리기' : '돌리기'}
        </Button>
        {winner && <Button onClick={reset} variant="secondary" size="lg">초기화</Button>}
      </div>

      {spinCount > 0 && !winner && !spinning && (
        <p className="text-xs text-slate-400">{spinCount}번째 시도</p>
      )}
    </div>
  );
}
