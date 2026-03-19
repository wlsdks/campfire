import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

const SEGMENT_COLORS = [
  '#4F46E5', '#818CF8', '#6366F1', '#A5B4FC',
  '#4338CA', '#C7D2FE', '#3730A3', '#93C5FD',
];

function getSpinResult(nameCount, segmentAngle) {
  const winnerIndex = Math.floor(Math.random() * nameCount);
  const extraRotations = (5 + Math.random() * 3) * 360;
  return {
    winnerIndex,
    targetAngle: extraRotations + (360 - winnerIndex * segmentAngle - segmentAngle / 2),
  };
}

export default function Roulette({ participants, onResult }) {
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

  const names = participants.map(p => p.nickname);
  const segmentAngle = 360 / (names.length || 1);

  function spin() {
    if (spinning || names.length === 0) return;
    setSpinning(true);
    setWinner(null);
    const { winnerIndex, targetAngle } = getSpinResult(names.length, segmentAngle);
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
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Target size={32} className="text-indigo-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-slate-900">돌림판</h3>
          <p className="text-slate-400 text-sm">참여자가 접속하면 시작할 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[320px] aspect-square mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10 text-3xl text-indigo-600 drop-shadow">
          ▼
        </div>
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          <circle cx="100" cy="100" r="98" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
          {names.map((name, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 100 + 95 * Math.cos(startRad);
            const y1 = 100 + 95 * Math.sin(startRad);
            const x2 = 100 + 95 * Math.cos(endRad);
            const y2 = 100 + 95 * Math.sin(endRad);
            const largeArc = segmentAngle > 180 ? 1 : 0;
            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
            const textX = 100 + 62 * Math.cos(midRad);
            const textY = 100 + 62 * Math.sin(midRad);
            const textRotation = (startAngle + endAngle) / 2;
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
          })}
          <circle cx="100" cy="100" r="18" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
          <text x="100" y="100" fill="#4F46E5" fontSize="10" fontWeight="bold" fontFamily="'Pretendard', system-ui" textAnchor="middle" dominantBaseline="central">GO</text>
        </motion.svg>
      </div>

      {winner && (
        <motion.div
          initial={{ scale: 0, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 18 }}
          className="text-center space-y-1"
        >
          <div className="text-4xl font-bold text-indigo-600">{winner}</div>
          <div className="text-slate-500 text-base">당첨되었습니다!</div>
        </motion.div>
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
            돌리기
          </span>
        )}
      </Button>
    </div>
  );
}
