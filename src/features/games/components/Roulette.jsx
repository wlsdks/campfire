import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));

// Indigo gradient — all dark enough for white text
const SEGMENT_COLORS = [
  '#1E1B4B', '#312E81', '#3730A3', '#4338CA',
  '#4F46E5', '#6366F1', '#4338CA', '#312E81',
];

function getWeightedSpinResult(segments) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  let winnerIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    rand -= segments[i].weight;
    if (rand <= 0) { winnerIndex = i; break; }
  }
  let angleToCenter = 0;
  for (let i = 0; i < winnerIndex; i++) angleToCenter += segments[i].angle;
  angleToCenter += segments[winnerIndex].angle / 2;
  const extraRotations = (6 + Math.random() * 3) * 360;
  return { winnerIndex, targetAngle: extraRotations + (360 - angleToCenter) };
}

export default function Roulette({ participants, scores = {}, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const segmentsWithAngle = useMemo(() => {
    const segs = participants.map(p => {
      const s = scores[p.id];
      const weight = 1 + (s?.tickets || 0) + Math.floor((s?.total || 0) / 100);
      return { name: p.nickname, weight };
    });
    const total = segs.reduce((sum, s) => sum + s.weight, 0) || 1;
    return segs.reduce((acc, s) => {
      const angle = (s.weight / total) * 360;
      const startAngle = acc.length > 0 ? acc[acc.length - 1].startAngle + acc[acc.length - 1].angle : 0;
      acc.push({ ...s, angle, startAngle });
      return acc;
    }, []);
  }, [participants, scores]);

  const names = useMemo(() => segmentsWithAngle.map(s => s.name), [segmentsWithAngle]);

  function spin() {
    if (spinning || names.length === 0) return;
    setSpinning(true);
    setWinner(null);
    const { winnerIndex, targetAngle } = getWeightedSpinResult(segmentsWithAngle);
    setRotation(prev => prev + targetAngle);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setSpinning(false);
      const w = names[winnerIndex];
      setWinner(w);
      hapticSuccess();
      onResult?.(w);
    }, 4500);
  }

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">돌림판</h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  const fontSize = names.length > 20 ? 5 : names.length > 12 ? 6 : names.length > 6 ? 8 : 10;
  const textR = names.length > 20 ? 55 : names.length > 12 ? 58 : 62;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
      {/* Wheel */}
      <div className="relative w-full max-w-lg aspect-square mx-auto">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <svg width="36" height="30" viewBox="0 0 36 30" fill="none">
            <path d="M18 30L2 2H34L18 30Z" className="fill-slate-900 dark:fill-slate-100" />
          </svg>
        </div>

        {/* Glow ring when spinning */}
        {spinning && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 40px 8px rgba(79,70,229,0.25)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-lg"
          animate={{ rotate: rotation }}
          transition={{ duration: 4.5, ease: [0.12, 0.56, 0.08, 0.99] }}
        >
          <circle cx="100" cy="100" r="99" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
          {segmentsWithAngle.map((seg, i) => {
            const sa = seg.startAngle;
            const ea = sa + seg.angle;
            const mr = ((sa + ea) / 2 - 90) * Math.PI / 180;
            const tx = 100 + textR * Math.cos(mr), ty = 100 + textR * Math.sin(mr);
            const tr = (sa + ea) / 2;
            const dn = seg.name.length > 5 ? seg.name.slice(0, 5) + '..' : seg.name;

            // Full circle (1 participant) — SVG arc can't draw 360°
            const isFull = seg.angle >= 359.9;

            return (
              <g key={i}>
                {isFull ? (
                  <circle cx="100" cy="100" r="97" fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} />
                ) : (
                  <path
                    d={`M100,100 L${100 + 97 * Math.cos((sa - 90) * Math.PI / 180)},${100 + 97 * Math.sin((sa - 90) * Math.PI / 180)} A97,97 0 ${seg.angle > 180 ? 1 : 0},1 ${100 + 97 * Math.cos((ea - 90) * Math.PI / 180)},${100 + 97 * Math.sin((ea - 90) * Math.PI / 180)} Z`}
                    fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.8"
                  />
                )}
                <text
                  x={tx} y={ty} fill="white" fontSize={fontSize} fontWeight="700"
                  fontFamily="'Pretendard','Inter',system-ui,sans-serif"
                  textAnchor="middle" dominantBaseline="central"
                  transform={`rotate(${tr},${tx},${ty})`}
                >{dn}</text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="22" fill="white" />
          <circle cx="100" cy="100" r="20" fill="#FAFAFA" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="100" y="100" fill="#4F46E5" fontSize="7" fontWeight="800" fontFamily="'Pretendard',system-ui" textAnchor="middle" dominantBaseline="central">PICK</text>
        </motion.svg>
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
          <Button onClick={() => setWinner(null)} variant="secondary" size="lg">
            <RotateCcw size={18} /> 다시 돌리기
          </Button>
        )}
        <Button onClick={spin} disabled={spinning} variant="primary" size="lg">
          {spinning ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              돌리는 중...
            </span>
          ) : winner ? '한 번 더' : '돌리기'}
        </Button>
      </div>
    </div>
  );
}
