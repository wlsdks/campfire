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

  const COLORS = [
    '#7c3aed', '#3b82f6', '#10b981', '#f59e0b',
    '#f43f5e', '#06b6d4', '#ec4899', '#84cc16',
    '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
  ];

  // Empty state
  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="text-7xl animate-float">🎯</div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">돌림판</h3>
          <p className="text-white/40 text-lg">참여자가 접속하면 시작할 수 있어요</p>
        </div>
        <div className="glass rounded-2xl px-6 py-3 text-white/30 text-sm">
          학생들에게 QR 코드를 공유하세요
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-96 h-96">
        {/* Pointer triangle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-4xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 8px rgba(124, 58, 237, 0.4))' }}>
          ▼
        </div>

        {/* Glow effect behind wheel */}
        <div className={`absolute inset-0 rounded-full bg-violet-500/20 blur-2xl transition-opacity duration-500 ${spinning ? 'opacity-100' : 'opacity-0'}`} />

        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {/* Outer ring */}
          <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

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
                  fill={COLORS[i % COLORS.length]}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="1"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize={names.length > 10 ? '6' : '8'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {name.length > 6 ? name.slice(0, 6) + '..' : name}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle cx="100" cy="100" r="14" fill="#1e1b4b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <text x="100" y="100" fill="white" fontSize="8" textAnchor="middle" dominantBaseline="middle">
            GO
          </text>
        </motion.svg>
      </div>

      {winner && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center space-y-2"
        >
          <div className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            {winner}
          </div>
          <div className="text-white/50 text-lg">당첨되었습니다!</div>
        </motion.div>
      )}

      <motion.button
        onClick={spin}
        disabled={spinning || names.length === 0}
        whileTap={{ scale: 0.95 }}
        className="px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg disabled:opacity-30 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:from-violet-500 hover:to-indigo-500 transition-all"
      >
        {spinning ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="inline-block"
            >
              🎯
            </motion.span>
            돌리는 중...
          </span>
        ) : '돌리기!'}
      </motion.button>
    </div>
  );
}
