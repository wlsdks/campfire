import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));

/**
 * SlotMachine — 777 style name slot game.
 * 3 reels spin and stop one by one. When all 3 match = winner!
 * Guaranteed to hit within 1-6 spins via internal probability.
 */
export default function SlotMachine({ participants, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([null, null, null]);
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const [stopped, setStopped] = useState([false, false, false]);
  const timerRefs = useRef([]);
  const guaranteedWinner = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const names = participants.map(p => p.nickname);

  const pickRandom = useCallback(() => names[Math.floor(Math.random() * names.length)], [names]);

  function spin() {
    if (spinning || names.length === 0) return;

    const nextCount = spinCount + 1;
    setSpinCount(nextCount);
    setSpinning(true);
    setWinner(null);
    setStopped([false, false, false]);

    // Guarantee win within 6 spins
    if (!guaranteedWinner.current) {
      guaranteedWinner.current = pickRandom();
    }

    // Determine if this spin should win
    // Probability increases each spin: spin 1=20%, 2=30%, 3=50%, 4=70%, 5=90%, 6=100%
    const winChance = [0.2, 0.3, 0.5, 0.7, 0.9, 1.0][Math.min(nextCount - 1, 5)];
    const shouldWin = Math.random() < winChance;

    // Generate reel results
    let r1, r2, r3;
    if (shouldWin) {
      const w = guaranteedWinner.current;
      r1 = w; r2 = w; r3 = w;
    } else {
      // Near miss — 2 match sometimes for excitement
      const nearMiss = Math.random() < 0.4;
      r1 = pickRandom();
      r2 = nearMiss ? r1 : pickRandom();
      r3 = pickRandom();
      // Ensure not accidentally 3 match
      while (r1 === r2 && r2 === r3) r3 = pickRandom();
    }

    // Animate reels with cycling effect then stop one by one
    const cycleInterval = 80;
    const reel1Duration = 1200;
    const reel2Duration = 2000;
    const reel3Duration = 2800;

    // Rapid cycling animation
    const cycleTimer = setInterval(() => {
      if (!mountedRef.current) return;
      setReels([pickRandom(), pickRandom(), pickRandom()]);
    }, cycleInterval);

    // Stop reel 1
    timerRefs.current[0] = setTimeout(() => {
      if (!mountedRef.current) return;
      setStopped(prev => [true, prev[1], prev[2]]);
      setReels(prev => [r1, prev[1], prev[2]]);
    }, reel1Duration);

    // Stop reel 2
    timerRefs.current[1] = setTimeout(() => {
      if (!mountedRef.current) return;
      setStopped(prev => [prev[0], true, prev[2]]);
      setReels(prev => [prev[0], r2, prev[2]]);
    }, reel2Duration);

    // Stop reel 3 + check result
    timerRefs.current[2] = setTimeout(() => {
      clearInterval(cycleTimer);
      if (!mountedRef.current) return;
      setStopped([true, true, true]);
      setReels([r1, r2, r3]);
      setSpinning(false);

      if (r1 === r2 && r2 === r3) {
        hapticSuccess();
        setWinner(r1);
        guaranteedWinner.current = null;
        setSpinCount(0);
        onResult?.(r1);
      }
    }, reel3Duration);

    timerRefs.current[3] = cycleTimer;
  }

  function reset() {
    setWinner(null);
    setReels([null, null, null]);
    setStopped([false, false, false]);
    guaranteedWinner.current = null;
    setSpinCount(0);
  }

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Sparkles size={36} className="text-slate-400" />
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">777 슬롯</h3>
          <p className="text-slate-400 text-sm">참여자가 접속하면 시작할 수 있어요</p>
        </div>
      </div>
    );
  }

  const isMatch = reels[0] && reels[0] === reels[1] && reels[1] === reels[2];

  return (
    <div className="flex flex-col items-center gap-8">
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">777 슬롯</h3>

      {/* Slot reels */}
      <div className="flex gap-3 justify-center">
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={spinning && !stopped[idx] ? { y: [0, -8, 0] } : {}}
            transition={spinning && !stopped[idx] ? { repeat: Infinity, duration: 0.15 } : {}}
            className={`w-24 h-28 rounded-2xl flex flex-col items-center justify-center gap-1 ${
              stopped[idx] && isMatch
                ? 'bg-slate-900 dark:bg-slate-100 shadow-lg'
                : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600'
            } transition-colors duration-300`}
          >
            {reels[idx] ? (
              <>
                <motion.div
                  key={reels[idx] + idx + (stopped[idx] ? 's' : 'c')}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: stopped[idx] ? 1 : 0.9, opacity: 1 }}
                  transition={stopped[idx] ? { type: 'spring', stiffness: 400, damping: 22 } : { duration: 0.05 }}
                >
                  <Avatar name={reels[idx]} size={stopped[idx] ? 'md' : 'sm'} />
                </motion.div>
                <span className={`text-xs font-bold truncate max-w-[80px] ${
                  stopped[idx] && isMatch ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {reels[idx]}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">?</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Winner celebration */}
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
        <Button onClick={spin} variant="primary" size="lg" disabled={spinning || names.length === 0}>
          {spinning ? '돌리는 중...' : winner ? '다시 돌리기' : '돌리기'}
        </Button>
        {winner && (
          <Button onClick={reset} variant="secondary" size="lg">
            초기화
          </Button>
        )}
      </div>

      {spinCount > 0 && !winner && !spinning && (
        <p className="text-xs text-slate-400">{spinCount}번째 시도</p>
      )}
    </div>
  );
}
