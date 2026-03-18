import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Roulette({ participants, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  const names = participants.map(p => p.nickname);
  const segmentAngle = 360 / (names.length || 1);

  function spin() {
    if (spinning || names.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * names.length);
    const extraRotations = (5 + Math.random() * 3) * 360;
    const targetAngle = extraRotations + (360 - winnerIndex * segmentAngle - segmentAngle / 2);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      setWinner(names[winnerIndex]);
      onResult?.(names[winnerIndex]);
    }, 4000);
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-80 h-80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-3xl">▼</div>
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
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
            const textX = 100 + 60 * Math.cos(midRad);
            const textY = 100 + 60 * Math.sin(midRad);
            const textRotation = (startAngle + endAngle) / 2;

            return (
              <g key={name}>
                <path
                  d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={COLORS[i % COLORS.length]}
                  stroke="#1f2937"
                  strokeWidth="1"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                >
                  {name.length > 6 ? name.slice(0, 6) + '..' : name}
                </text>
              </g>
            );
          })}
        </motion.svg>
      </div>

      {winner && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="text-5xl font-bold text-yellow-400">🎉 {winner} 🎉</div>
          <div className="text-white/60 mt-2">당첨!</div>
        </motion.div>
      )}

      <button
        onClick={spin}
        disabled={spinning || names.length === 0}
        className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-lg disabled:opacity-40"
      >
        {spinning ? '돌리는 중...' : '돌리기!'}
      </button>
    </div>
  );
}
