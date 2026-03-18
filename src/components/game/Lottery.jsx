import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lottery({ participants, onResult }) {
  const [count, setCount] = useState(1);
  const [winners, setWinners] = useState([]);
  const [revealing, setRevealing] = useState(false);

  function draw() {
    if (revealing || participants.length === 0) return;
    setRevealing(true);
    setWinners([]);

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, participants.length));

    picked.forEach((p, i) => {
      setTimeout(() => {
        setWinners(prev => [...prev, p.nickname]);
        if (i === picked.length - 1) {
          setRevealing(false);
          onResult?.(picked.map(p => p.nickname));
        }
      }, (i + 1) * 800);
    });
  }

  const CARD_COLORS = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];

  // Empty state
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="text-7xl">🎰</div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">제비뽑기</h3>
          <p className="text-gray-400 text-lg">참여자가 접속하면 시작할 수 있어요</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-3 text-gray-400 text-sm">
          학생들에게 QR 코드를 공유하세요
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm font-medium">추첨 인원</span>
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setCount(Math.max(1, count - 1))}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 transition-colors font-bold"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={participants.length}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(participants.length, Number(e.target.value))))}
            className="w-14 py-2 bg-transparent text-gray-900 text-center font-bold focus:outline-none"
          />
          <button
            onClick={() => setCount(Math.min(participants.length, count + 1))}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 transition-colors font-bold"
          >
            +
          </button>
        </div>
        <span className="text-gray-400 text-sm">/ {participants.length}명</span>
      </div>

      <div className="flex flex-wrap gap-5 justify-center min-h-[240px] items-center px-4">
        <AnimatePresence mode="popLayout">
          {winners.map((name, i) => (
            <motion.div
              key={name + i}
              initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 150, damping: 15 }}
              className={`w-36 h-44 ${CARD_COLORS[i % CARD_COLORS.length]} rounded-2xl flex flex-col items-center justify-center shadow-sm`}
              style={{ perspective: 1000 }}
            >
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-white font-bold text-lg">{name}</div>
              <div className="text-white/70 text-xs mt-1">#{i + 1} 당첨</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {winners.length === 0 && !revealing && (
          <div className="text-center space-y-3">
            <div className="text-5xl opacity-30">🎰</div>
            <p className="text-gray-300 text-lg">추첨 버튼을 눌러주세요</p>
          </div>
        )}

        {revealing && winners.length === 0 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="text-center space-y-3"
          >
            <div className="text-5xl">🎰</div>
            <p className="text-gray-500 text-lg">추첨 중...</p>
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={draw}
        disabled={revealing || participants.length === 0}
        whileTap={{ scale: 0.95 }}
        className="px-10 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg disabled:opacity-30 shadow-sm transition-all"
      >
        {revealing ? '추첨 중...' : '추첨하기!'}
      </motion.button>
    </div>
  );
}
