import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Loader2, Minus, Plus, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';

const CARD_COLORS = [
  'bg-indigo-600', 'bg-indigo-500', 'bg-indigo-700',
  'bg-slate-700', 'bg-indigo-800', 'bg-slate-600',
];

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

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Ticket size={32} className="text-indigo-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-slate-900">제비뽑기</h3>
          <p className="text-slate-400 text-sm">참여자가 접속하면 시작할 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Count selector */}
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-sm font-medium">추첨 인원</span>
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <button onClick={() => setCount(Math.max(1, count - 1))} className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 transition-colors">
            <Minus size={14} />
          </button>
          <input
            type="number" min={1} max={participants.length} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(participants.length, Number(e.target.value))))}
            className="w-12 py-2 bg-transparent text-slate-900 text-center font-bold text-sm focus:outline-none"
          />
          <button onClick={() => setCount(Math.min(participants.length, count + 1))} className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <span className="text-slate-400 text-sm">/ {participants.length}명</span>
      </div>

      {/* Cards area */}
      <div className="flex flex-wrap gap-4 justify-center min-h-[220px] items-center px-4">
        <AnimatePresence mode="popLayout">
          {winners.map((name, i) => (
            <motion.div
              key={name + i}
              initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 150, damping: 15 }}
              className={`w-32 h-40 ${CARD_COLORS[i % CARD_COLORS.length]} rounded-xl flex flex-col items-center justify-center shadow-md`}
              style={{ perspective: 1000 }}
            >
              <Trophy size={28} className="text-white/80 mb-2" />
              <div className="text-white font-bold text-base">{name}</div>
              <div className="text-white/50 text-xs mt-1">#{i + 1} 당첨</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {winners.length === 0 && !revealing && (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
              <Ticket size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-300 text-base">추첨 버튼을 눌러주세요</p>
          </div>
        )}

        {revealing && winners.length === 0 && (
          <div className="text-center space-y-2">
            <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto" />
            <p className="text-slate-500 text-base">추첨 중...</p>
          </div>
        )}
      </div>

      <Button onClick={draw} disabled={revealing || participants.length === 0} variant="primary" size="lg">
        {revealing ? (
          <span className="flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> 추첨 중...</span>
        ) : (
          <span className="flex items-center gap-2"><Ticket size={20} /> 추첨하기</span>
        )}
      </Button>
    </div>
  );
}
