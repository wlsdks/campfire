import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Loader2, Minus, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfettiBurst from '@/features/quiz/components/ConfettiBurst';

function pickWinners(participants, count) {
  const pool = [...participants];
  const winners = [];
  const safeCount = Math.min(count, pool.length);
  while (winners.length < safeCount && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

/** SlotReel — uses direct DOM manipulation to avoid state-update freeze. */
const SlotReel = memo(function SlotReel({ names, running, finalName }) {
  const textRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && names.length > 0) {
      intervalRef.current = setInterval(() => {
        if (textRef.current) {
          textRef.current.textContent = names[Math.floor(Math.random() * names.length)];
        }
      }, 80);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [running, names]);

  return (
    <div className="h-16 flex items-center justify-center overflow-hidden">
      {running ? (
        <motion.span
          ref={textRef}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
        >...</motion.span>
      ) : finalName ? (
        <motion.span
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
        >{finalName}</motion.span>
      ) : null}
    </div>
  );
});

function WinnerCard({ winner, index, total }) {
  const initial = (winner.nickname || '?')[0].toUpperCase();

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.08,
      }}
      className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3"
      data-sound="winner-reveal"
    >
      <ConfettiBurst />
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100 flex items-center justify-center text-2xl font-bold">
        {initial}
      </div>
      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        {winner.nickname}
      </span>
      <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-bold">
        {total > 1 ? `#${index + 1} ` : ''}당첨!
      </span>
    </motion.div>
  );
}

export default function PrizeDraw({ participants, onResult }) {
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle | spinning | revealed
  const [winners, setWinners] = useState([]);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const names = participants.map((p) => p.nickname);

  const startDraw = useCallback(() => {
    if (phase !== 'idle' || names.length === 0) return;
    setPhase('spinning');
    setWinners([]);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const picked = pickWinners(participants, count);

    // Slot machine runs for 2.5s, then reveal
    const revealTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setWinners(picked);
      setPhase('revealed');
      onResult?.(picked.map((w) => w.nickname));
    }, 2500);
    timersRef.current.push(revealTimer);
  }, [phase, names, participants, count, onResult]);

  const reset = useCallback(() => {
    setPhase('idle');
    setWinners([]);
  }, []);

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Gift size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">경품 추첨</h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
      {/* Count selector - only in idle */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <span className="text-slate-500 text-sm font-medium">추첨 인원</span>
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              aria-label="추첨 인원 감소"
              className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              max={names.length}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(names.length, Number(e.target.value) || 1)))}
              aria-label="추첨 인원 수"
              className="w-12 py-2 bg-transparent text-slate-900 dark:text-slate-100 text-center font-bold text-sm focus:outline-none"
            />
            <button
              onClick={() => setCount(Math.min(names.length, count + 1))}
              aria-label="추첨 인원 증가"
              className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-slate-400 text-sm">/ {names.length}명</span>
        </motion.div>
      )}

      {/* Slot machine during spinning */}
      {phase === 'spinning' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 w-full max-w-md mx-auto text-center"
          data-sound="slot-spin"
        >
          <p className="text-slate-400 text-sm mb-4 font-medium">추첨 중...</p>
          <SlotReel names={names} running finalName="" />
        </motion.div>
      )}

      {/* Winner reveal */}
      {phase === 'revealed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`w-full ${
            winners.length === 1
              ? 'flex justify-center'
              : winners.length <= 3
                ? 'flex flex-wrap justify-center gap-4'
                : 'grid grid-cols-2 gap-4'
          }`}
        >
          {winners.map((w, i) => (
            <WinnerCard key={w.id || i} winner={w} index={i} total={winners.length} />
          ))}
        </motion.div>
      )}

      {/* Action button */}
      {phase === 'idle' && (
        <Button onClick={startDraw} disabled={names.length === 0} variant="primary" size="lg">
          <Gift size={20} />
          추첨 시작
        </Button>
      )}

      {phase === 'spinning' && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">당첨자를 선정하고 있습니다...</span>
        </div>
      )}

      {phase === 'revealed' && (
        <Button onClick={reset} variant="secondary" size="md">
          다시 추첨하기
        </Button>
      )}
    </div>
  );
}
