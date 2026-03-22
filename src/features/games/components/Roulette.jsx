import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Loader2, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));
// Monochromatic slate segments
const SEGMENT_COLORS = [
  '#0F172A', '#334155', '#64748B', '#94A3B8',
  '#1E293B', '#475569', '#CBD5E1', '#334155',
];

function getWeightedSpinResult(segments) {
  // Weighted random — more tickets/points = higher probability
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  let winnerIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    rand -= segments[i].weight;
    if (rand <= 0) { winnerIndex = i; break; }
  }
  // Calculate angle to winner's segment center
  let angleToCenter = 0;
  for (let i = 0; i < winnerIndex; i++) angleToCenter += segments[i].angle;
  angleToCenter += segments[winnerIndex].angle / 2;
  const extraRotations = (5 + Math.random() * 3) * 360;
  return { winnerIndex, targetAngle: extraRotations + (360 - angleToCenter) };
}

export default function Roulette({ participants, scores = {}, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Build weighted segments — everyone gets at least 1 base weight
  const segments = participants.map(p => {
    const s = scores[p.id];
    const tickets = s?.tickets || 0;
    const total = s?.total || 0;
    const weight = 1 + tickets + Math.floor(total / 100); // base 1 + tickets + score/100
    return { name: p.nickname, weight };
  });
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0) || 1;
  const segmentsWithAngle = segments.map(s => ({
    ...s,
    angle: (s.weight / totalWeight) * 360,
  }));
  const names = segments.map(s => s.name);

  function spin() {
    if (spinning || names.length === 0) return;
    setSpinning(true);
    setWinner(null);
    const { winnerIndex, targetAngle } = getWeightedSpinResult(segmentsWithAngle);
    setRotation(prev => prev + targetAngle);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setSpinning(false);
      setWinner(names[winnerIndex]);
      onResult?.(names[winnerIndex]);
    }, 4000);
  }

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Target size={36} className="text-slate-400" />
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">돌림판</h3>
          <p className="text-slate-400 text-sm">참여자가 접속하면 시작할 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[320px] aspect-square mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10 drop-shadow">
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20L0 0H24L12 20Z" fill={'#0F172A'} />
          </svg>
        </div>
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          <circle cx="100" cy="100" r="98" fill="none" stroke={"#E2E8F0"} strokeWidth="1.5" />
          {(() => {
            let cumulativeAngle = 0;
            return segmentsWithAngle.map((seg, i) => {
            const startAngle = cumulativeAngle;
            const endAngle = startAngle + seg.angle;
            cumulativeAngle = endAngle;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 100 + 95 * Math.cos(startRad);
            const y1 = 100 + 95 * Math.sin(startRad);
            const x2 = 100 + 95 * Math.cos(endRad);
            const y2 = 100 + 95 * Math.sin(endRad);
            const largeArc = seg.angle > 180 ? 1 : 0;
            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
            const textX = 100 + 62 * Math.cos(midRad);
            const textY = 100 + 62 * Math.sin(midRad);
            const textRotation = (startAngle + endAngle) / 2;
            const name = seg.name;
            return (
              <g key={name + i}>
                <path
                  d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                  stroke="white"
                  strokeWidth="1.5"
                />
                <text
                  x={textX} y={textY} fill="white"
                  fontSize={names.length > 10 ? '6' : '8'}
                  fontWeight="600"
                  fontFamily="'Pretendard', 'Inter', system-ui, sans-serif"
                  textAnchor="middle" dominantBaseline="central"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                >
                  {name.length > 6 ? name.slice(0, 6) + '..' : name}
                </text>
              </g>
            );
          })})()}
          <circle cx="100" cy="100" r="18" fill="white" stroke={"#E2E8F0"} strokeWidth="1.5" />
          <text x="100" y="100" fill={'#0F172A'} fontSize="10" fontWeight="bold" fontFamily="'Pretendard', system-ui" textAnchor="middle" dominantBaseline="central">GO</text>
        </motion.svg>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-center space-y-3"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>
            <Avatar name={winner} size="lg" />
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{winner}</div>
            <span className="inline-flex items-center px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-sm font-bold">
              당첨!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {winner && (
          <Button onClick={() => { setWinner(null); }} variant="secondary" size="lg">
            <RotateCcw size={18} />
            다시 돌리기
          </Button>
        )}
        <Button onClick={spin} disabled={spinning || names.length === 0} variant="primary" size="lg">
          {spinning ? (
            <span className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              돌리는 중...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Target size={20} />
              {winner ? '한 번 더' : '돌리기'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
