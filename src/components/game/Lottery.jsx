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

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <span className="text-white">추첨 인원:</span>
        <input
          type="number"
          min={1}
          max={participants.length}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-20 px-3 py-2 rounded-lg bg-gray-800 text-white text-center"
        />
        <span className="text-white/50">/ {participants.length}명</span>
      </div>

      <div className="flex flex-wrap gap-4 justify-center min-h-[200px] items-center">
        <AnimatePresence>
          {winners.map((name, i) => (
            <motion.div
              key={name + i}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="w-32 h-40 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <div className="text-center">
                <div className="text-3xl">🎉</div>
                <div className="text-white font-bold text-lg mt-2">{name}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {winners.length === 0 && !revealing && (
          <p className="text-white/30 text-lg">추첨 버튼을 눌러주세요</p>
        )}
      </div>

      <button
        onClick={draw}
        disabled={revealing || participants.length === 0}
        className="px-8 py-3 rounded-xl bg-amber-600 text-white font-bold text-lg disabled:opacity-40"
      >
        {revealing ? '추첨 중...' : '추첨하기!'}
      </button>
    </div>
  );
}
