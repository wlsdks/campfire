import { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot } from 'lucide-react';
import Button from '@/components/ui/Button';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));

const ROWS = 8;
const PIN_R = 3;
const BALL_R = 8;
const BOARD_W = 400;
const BOARD_H = 420;
const SLOT_H = 36;
const TOP_PAD = 30;

/** Generate pin positions in triangle pattern. */
function generatePins(rows) {
  const pins = [];
  const rowSpacing = (BOARD_H - TOP_PAD - SLOT_H - 40) / rows;
  for (let r = 0; r < rows; r++) {
    const count = r + 3;
    const y = TOP_PAD + 20 + r * rowSpacing;
    const totalW = (count - 1) * 32;
    const startX = (BOARD_W - totalW) / 2;
    for (let c = 0; c < count; c++) {
      pins.push({ x: startX + c * 32, y });
    }
  }
  return pins;
}

/** Pre-compute a believable ball path from top to target slot. */
function computePath(targetSlot, totalSlots, rows) {
  const slotW = (BOARD_W - 40) / totalSlots;
  const targetX = 20 + targetSlot * slotW + slotW / 2;
  const rowSpacing = (BOARD_H - TOP_PAD - SLOT_H - 40) / rows;

  const points = [{ x: BOARD_W / 2, y: 8 }];

  // Work backwards to create a path that ends at targetX
  const endX = targetX;
  const startX = BOARD_W / 2;

  for (let r = 0; r < rows; r++) {
    const progress = (r + 1) / rows;
    const baseX = startX + (endX - startX) * progress;
    // Add jitter that decreases as we get closer to target
    const jitter = (1 - progress * 0.7) * (Math.random() * 30 - 15);
    const x = Math.max(30, Math.min(BOARD_W - 30, baseX + jitter));
    const y = TOP_PAD + 20 + r * rowSpacing + 6;
    points.push({ x, y });
  }

  // Final position in slot
  points.push({ x: endX, y: BOARD_H - SLOT_H / 2 - 4 });
  return points;
}

export default function Plinko({ participants, onResult }) {
  const [dropping, setDropping] = useState(false);
  const [winner, setWinner] = useState(null);
  const [ballPath, setBallPath] = useState(null);
  const [ballStep, setBallStep] = useState(0);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => () => {
    mountedRef.current = false;
    timersRef.current.forEach(clearTimeout);
  }, []);

  const names = useMemo(() => participants.map(p => p.nickname), [participants]);
  const pins = useMemo(() => generatePins(ROWS), []);

  // Show max 8 slots, distribute names
  const slots = useMemo(() => {
    if (names.length === 0) return [];
    const maxSlots = Math.min(names.length, 8);
    return names.slice(0, maxSlots);
  }, [names]);

  const slotW = slots.length > 0 ? (BOARD_W - 40) / slots.length : 0;

  const drop = useCallback(() => {
    if (dropping || names.length === 0) return;
    timersRef.current.forEach(clearTimeout);
    setDropping(true);
    setWinner(null);
    setBallStep(0);

    const winnerIdx = Math.floor(Math.random() * slots.length);
    const path = computePath(winnerIdx, slots.length, ROWS);
    setBallPath(path);

    // Animate step by step
    path.forEach((_, i) => {
      if (i === 0) return;
      timersRef.current.push(setTimeout(() => {
        if (!mountedRef.current) return;
        setBallStep(i);
        if (i === path.length - 1) {
          setTimeout(() => {
            if (!mountedRef.current) return;
            setDropping(false);
            setWinner(slots[winnerIdx]);
            hapticSuccess();
            onResult?.(slots[winnerIdx]);
          }, 300);
        }
      }, i * 220));
    });
  }, [dropping, names, slots, onResult]);

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <CircleDot size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">핀볼</h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  const ballPos = ballPath && ballStep < ballPath.length ? ballPath[ballStep] : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">핀볼</h3>

      {/* Board — responsive: viewBox scales to fit, max 400px */}
      <div className="relative mx-auto w-full" style={{ maxWidth: BOARD_W, aspectRatio: `${BOARD_W} / ${BOARD_H}` }}>
        <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="w-full h-full drop-shadow-md">
          {/* Background */}
          <rect x="0" y="0" width={BOARD_W} height={BOARD_H} rx="16" fill="currentColor" className="text-slate-100 dark:text-slate-800" />

          {/* Pins */}
          {pins.map((pin, i) => (
            <circle key={i} cx={pin.x} cy={pin.y} r={PIN_R} className="fill-slate-300 dark:fill-slate-600" />
          ))}

          {/* Slot dividers */}
          {slots.map((_, i) => {
            if (i === 0) return null;
            const x = 20 + i * slotW;
            return <line key={`d${i}`} x1={x} y1={BOARD_H - SLOT_H - 8} x2={x} y2={BOARD_H - 4} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" />;
          })}

          {/* Slot labels */}
          {slots.map((name, i) => {
            const x = 20 + i * slotW + slotW / 2;
            const displayName = name.length > 4 ? name.slice(0, 4) : name;
            const isWinnerSlot = winner === name;
            return (
              <text
                key={`s${i}`}
                x={x}
                y={BOARD_H - SLOT_H / 2 + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={slots.length > 6 ? 9 : 11}
                fontWeight="700"
                fontFamily="'Pretendard','Inter',system-ui,sans-serif"
                className={isWinnerSlot ? 'fill-indigo-600 dark:fill-indigo-400' : 'fill-slate-500 dark:fill-slate-400'}
              >
                {displayName}
              </text>
            );
          })}

          {/* Ball */}
          {ballPos && (
            <motion.circle
              cx={ballPos.x}
              cy={ballPos.y}
              r={BALL_R}
              className="fill-slate-900 dark:fill-slate-100"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            />
          )}

          {/* Drop zone indicator */}
          {!dropping && !winner && (
            <motion.circle
              cx={BOARD_W / 2}
              cy={8}
              r={BALL_R}
              className="fill-slate-900 dark:fill-slate-100"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>

      {/* Winner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative text-center space-y-4"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-900 dark:text-slate-100 ring-4 ring-slate-200 dark:ring-slate-700">
              {winner.charAt(0).toUpperCase()}
            </div>
            <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{winner}</div>
            <span className="inline-flex items-center px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-base font-bold">
              당첨!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        {winner && (
          <Button onClick={() => { setWinner(null); setBallPath(null); setBallStep(0); }} variant="secondary" size="lg">
            다시 하기
          </Button>
        )}
        <Button onClick={drop} disabled={dropping} variant="primary" size="lg">
          {dropping ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              떨어지는 중...
            </span>
          ) : winner ? '한 번 더' : '떨어뜨리기'}
        </Button>
      </div>
    </div>
  );
}
