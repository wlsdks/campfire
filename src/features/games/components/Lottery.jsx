import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Loader2, Minus, Plus, Trophy, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

const ConfettiBurst = lazy(() => import('@/features/quiz/components/ConfettiBurst'));

const CARD_COLORS = [
  'bg-slate-900', 'bg-slate-700', 'bg-slate-800',
  'bg-slate-600', 'bg-slate-900',
];

function pickLotteryWinners(participants, count) {
  const hasTicketMode = participants.some((participant) => (participant.tickets || 0) > 0);
  const pool = (hasTicketMode
    ? participants.filter((participant) => (participant.tickets || 0) > 0)
    : participants
  ).map((participant) => ({ ...participant }));
  const winners = [];

  while (pool.length > 0 && winners.length < Math.min(count, pool.length)) {
    const totalWeight = pool.reduce((sum, participant) => (
      sum + (hasTicketMode ? participant.tickets || 0 : 1)
    ), 0);
    let cursor = Math.random() * totalWeight;
    let pickedIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      cursor -= hasTicketMode ? pool[index].tickets || 0 : 1;
      if (cursor <= 0) {
        pickedIndex = index;
        break;
      }
    }

    winners.push(pool.splice(pickedIndex, 1)[0]);
  }

  return { winners, hasTicketMode };
}

export default function Lottery({ participants, onResult }) {
  const [count, setCount] = useState(1);
  const [winners, setWinners] = useState([]);
  const [revealing, setRevealing] = useState(false);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const hasTicketMode = participants.some((participant) => (participant.tickets || 0) > 0);
  const eligibleParticipants = hasTicketMode
    ? participants.filter((participant) => (participant.tickets || 0) > 0)
    : participants;
  const totalTickets = eligibleParticipants.reduce((sum, participant) => sum + (participant.tickets || 0), 0);

  function draw() {
    if (revealing || participants.length === 0) return;
    setRevealing(true);
    setWinners([]);
    const normalizedCount = Number.isFinite(count) && count > 0 ? count : 1;
    const { winners: picked } = pickLotteryWinners(participants, normalizedCount);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (picked.length === 0) {
      setRevealing(false);
      return;
    }

    picked.forEach((p, i) => {
      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        setWinners(prev => [...prev, p]);
        if (i === picked.length - 1) {
          setRevealing(false);
          onResult?.(picked.map((winner) => winner.nickname));
        }
      }, (i + 1) * 800);
      timersRef.current.push(timer);
    });
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Ticket size={36} className="text-slate-400" />
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{hasTicketMode ? '보상 추첨' : '제비뽑기'}</h3>
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
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button onClick={() => setCount(Math.max(1, count - 1))} className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Minus size={14} />
          </button>
          <input
            type="number" min={1} max={eligibleParticipants.length} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(eligibleParticipants.length, Number(e.target.value))))}
            className="w-12 py-2 bg-transparent text-slate-900 dark:text-slate-100 dark:bg-transparent text-center font-bold text-sm focus:outline-none"
          />
          <button onClick={() => setCount(Math.min(eligibleParticipants.length, count + 1))} className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <span className="text-slate-400 text-sm">/ {eligibleParticipants.length}명</span>
      </div>

      <div className="text-center space-y-1">
        <p className="text-slate-500 text-sm">
          {hasTicketMode ? '퀴즈와 참여로 모은 티켓이 많을수록 당첨 확률이 올라갑니다' : '현재는 균등 추첨으로 진행됩니다'}
        </p>
        {hasTicketMode && (
          <p className="text-slate-600 text-sm font-medium">현재 티켓 총합 {totalTickets}장</p>
        )}
      </div>

      {/* Cards area */}
      <div className="flex flex-wrap gap-4 justify-center min-h-[220px] items-center px-4">
        <AnimatePresence mode="popLayout">
          {winners.map((winner, i) => (
            <motion.div
              key={winner.id}
              initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
              className={`w-36 h-44 ${CARD_COLORS[i % CARD_COLORS.length]} rounded-2xl flex flex-col items-center justify-center shadow-lg`}
              style={{ perspective: 1000 }}
            >
              {i === 0 && <Suspense fallback={null}><ConfettiBurst /></Suspense>}
              <Avatar name={winner.nickname} size="md" />
              <div className="text-white font-bold text-base mt-2">{winner.nickname}</div>
              <span className="mt-1 px-2 py-0.5 bg-white/20 rounded-full text-white/90 text-[10px] font-bold">
                #{i + 1} 당첨
              </span>
              {hasTicketMode && (
                <div className="text-white/60 text-[10px] mt-1">티켓 {winner.tickets || 0}장</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {winners.length === 0 && !revealing && (
          <div className="text-center space-y-2">
            <Ticket size={28} className="text-slate-400 mx-auto" />
            <p className="text-slate-400 text-base">추첨 버튼을 눌러주세요</p>
          </div>
        )}

        {revealing && winners.length === 0 && (
          <div className="text-center space-y-2">
            <Loader2 size={32} className="animate-spin text-slate-400 mx-auto" />
            <p className="text-slate-500 text-base">추첨 중...</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {winners.length > 0 && !revealing && (
          <Button onClick={() => setWinners([])} variant="secondary" size="lg">
            <RotateCcw size={18} />
            초기화
          </Button>
        )}
        <Button onClick={draw} disabled={revealing || eligibleParticipants.length === 0} variant="primary" size="lg">
          {revealing ? (
            <span className="flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> 추첨 중...</span>
          ) : (
            <span className="flex items-center gap-2"><Ticket size={20} /> {winners.length > 0 ? '다시 추첨' : hasTicketMode ? '보상 추첨' : '추첨하기'}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
