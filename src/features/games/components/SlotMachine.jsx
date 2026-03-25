import { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

/**
 * Single reel — uses direct DOM manipulation for cycling (no state updates).
 * Prevents the freeze bug that occurs with setInterval + setState.
 */
function Reel({ spinning, result, names, isMatch }) {
  const textRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (spinning && !result && names.length > 0) {
      intervalRef.current = setInterval(() => {
        if (textRef.current) {
          textRef.current.textContent = names[Math.floor(Math.random() * names.length)];
        }
      }, 80);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [spinning, result, names]);

  const bg = result && isMatch
    ? 'bg-slate-900 dark:bg-slate-100 shadow-lg shadow-slate-900/20'
    : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700';

  return (
    <div className={`w-32 sm:w-36 h-44 sm:h-48 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${bg}`}>
      {spinning && !result ? (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          <span
            ref={textRef}
            className="text-sm font-bold text-slate-400 dark:text-slate-500 transition-none"
          >...</span>
        </div>
      ) : result ? (
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex flex-col items-center gap-2"
        >
          <Avatar name={result} size="lg" className={isMatch ? 'ring-2 ring-white/30' : ''} />
          <span className={`text-sm font-bold truncate max-w-[110px] ${
            isMatch ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-200'
          }`}>{result}</span>
        </motion.div>
      ) : (
        <span className="text-4xl font-bold text-slate-200 dark:text-slate-700">?</span>
      )}
    </div>
  );
}

export default function SlotMachine({ participants, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState([null, null, null]);
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const guaranteedWinner = useRef(null);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const names = useMemo(() => participants.map(p => p.nickname), [participants]);

  const pickRandom = useCallback(() => names[Math.floor(Math.random() * names.length)], [names]);

  const spin = useCallback(() => {
    if (spinning || names.length === 0) return;
    timersRef.current.forEach(clearTimeout);

    const next = spinCount + 1;
    setSpinCount(next);
    setSpinning(true);
    setWinner(null);
    setResults([null, null, null]);

    if (!guaranteedWinner.current) {
      guaranteedWinner.current = names[Math.floor(Math.random() * names.length)];
    }

    const winChance = [0.2, 0.3, 0.5, 0.7, 0.9, 1.0][Math.min(next - 1, 5)];
    const shouldWin = Math.random() < winChance;

    let r1, r2, r3;
    if (shouldWin) {
      r1 = r2 = r3 = guaranteedWinner.current;
    } else {
      r1 = pickRandom();
      r2 = Math.random() < 0.4 ? r1 : pickRandom();
      r3 = pickRandom();
      while (r1 === r2 && r2 === r3) r3 = pickRandom();
    }

    // Stop reels sequentially
    timersRef.current[0] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults(prev => [r1, prev[1], prev[2]]);
    }, 1500);

    timersRef.current[1] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults(prev => [prev[0], r2, prev[2]]);
    }, 2400);

    timersRef.current[2] = setTimeout(() => {
      if (!mountedRef.current) return;
      setResults([r1, r2, r3]);
      setSpinning(false);
      if (r1 === r2 && r2 === r3) {
        hapticSuccess();
        setWinner(r1);
        guaranteedWinner.current = null;
        setSpinCount(0);
        onResult?.(r1);
      }
    }, 3300);
  }, [spinning, names, spinCount, pickRandom, onResult]);

  const reset = useCallback(() => {
    setWinner(null);
    setResults([null, null, null]);
    guaranteedWinner.current = null;
    setSpinCount(0);
  }, []);

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">7</span>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">777 슬롯</h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  const isMatch = results[0] && results[0] === results[1] && results[1] === results[2];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
      {/* Title */}
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          777 슬롯
        </h3>
        {spinCount > 0 && !winner && !spinning && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-400"
          >{spinCount}번째 시도</motion.p>
        )}
      </div>

      {/* Slot machine frame */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-3 sm:gap-4 justify-center">
          {[0, 1, 2].map(idx => (
            <Reel
              key={idx}
              spinning={spinning}
              result={results[idx]}
              names={names}
              isMatch={isMatch}
            />
          ))}
        </div>
      </div>

      {/* Winner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative text-center space-y-4"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>
            {/* Avatar — scale overshoot (jackpot feel) */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 0.95, 1.08, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            >
              <Avatar name={winner} size="xl" className="mx-auto ring-4 ring-slate-200 dark:ring-slate-700" />
            </motion.div>
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.25 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
            >
              {winner}
            </motion.div>
            {/* Badge */}
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.4 }}
              className="inline-flex items-center px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-base font-bold"
            >
              777 당첨!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        <Button onClick={spin} variant="primary" size="lg" disabled={spinning}>
          {spinning ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              돌리는 중...
            </span>
          ) : winner ? '다시 돌리기' : '돌리기'}
        </Button>
        {winner && <Button onClick={reset} variant="secondary" size="lg">초기화</Button>}
      </div>
    </div>
  );
}
