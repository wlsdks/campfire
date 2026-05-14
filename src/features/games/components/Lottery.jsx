import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

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

/**
 * SlotCard — 추첨 슬롯 한 칸.
 * rolling 페이즈: 이름이 빠르게 회전 (복권 슬롯머신).
 * stopped: 당첨자 확정. spring overshoot + particle 등장.
 */
function SlotCard({ index, color, rolling, displayName, winner, hasTicketMode, isFirst }) {
  const isStopped = !rolling && !!winner;

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        // rolling 중 살짝 진동, 멈출 때 spring overshoot
        initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
        animate={
          isStopped
            ? { rotateY: 0, opacity: 1, scale: [1, 1.12, 0.96, 1.04, 1] }
            : rolling
            ? { rotateY: 0, opacity: 1, scale: 1, x: [0, -2, 2, -2, 2, 0], y: [0, -1, 1, -1, 1, 0] }
            : { rotateY: 0, opacity: 1, scale: 1 }
        }
        transition={
          isStopped
            ? { rotateY: { duration: 0.3 }, opacity: { duration: 0.2 }, scale: { type: 'spring', stiffness: 380, damping: 16 } }
            : rolling
            ? { rotateY: { duration: 0.3 }, scale: { duration: 0.2 }, x: { duration: 0.18, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.22, repeat: Infinity, ease: 'easeInOut' } }
            : { type: 'spring', stiffness: 280, damping: 22 }
        }
        className={`w-40 h-52 ${color} rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Sheen sweep — rolling 중 반복, 멈추면 한 번만 */}
        <motion.div
          className="absolute inset-0 bg-white/15 rounded-2xl"
          initial={{ x: '-100%', skewX: '-20deg' }}
          animate={
            rolling
              ? { x: ['-100%', '200%'] }
              : { x: '200%' }
          }
          transition={
            rolling
              ? { duration: 0.9, repeat: Infinity, ease: 'easeOut' }
              : { duration: 0.45, ease: 'easeOut', delay: 0.1 }
          }
        />

        {/* 멈출 때 sparkle particle 8개 */}
        {isStopped && <SparkleBurst />}

        {/* 1등 카드만 confetti */}
        {isStopped && isFirst && <Suspense fallback={null}><ConfettiBurst /></Suspense>}

        <Avatar name={rolling ? displayName : winner?.nickname || '?'} size="lg" />

        {/* rolling 중에는 블러 처리한 빠른 이름 */}
        <div className={`text-white font-bold text-lg mt-2 transition ${rolling ? 'blur-[1px] opacity-90' : ''}`}>
          {rolling ? displayName : winner?.nickname}
        </div>

        <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isStopped ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'
        }`}>
          {isStopped ? `#${index + 1} 당첨` : '추첨 중...'}
        </span>

        {isStopped && hasTicketMode && (
          <div className="text-white/60 text-[10px] mt-1">티켓 {winner.tickets || 0}장</div>
        )}
      </motion.div>
    </div>
  );
}

/** SparkleBurst — 슬롯이 멈출 때 amber/white 작은 별 8개 분출. */
const SPARKLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
function SparkleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {SPARKLE_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const distance = 70 + Math.random() * 20;
        return (
          <motion.div
            key={i}
            className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-amber-300' : 'bg-white'}`}
            style={{ marginLeft: -4, marginTop: -4 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(rad) * distance,
              y: Math.sin(rad) * distance,
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          />
        );
      })}
    </div>
  );
}

/**
 * Lottery — 두근두근 복권/슬롯머신 풍 추첨.
 *
 * 흐름:
 *   1. 버튼 클릭 → N개 슬롯 카드 즉시 등장 (이름 빠르게 회전)
 *   2. 각 슬롯이 stagger로 멈춤 (1.6초 + 0.7초씩) — 마지막일수록 긴장감
 *   3. 멈출 때 spring overshoot + sparkle particle 분출
 *   4. 1등 슬롯에 confetti
 *
 * 총 시간: 1명 ~2초, 5명 ~5초 (이전 0.8초보다 dramatic)
 */
export default function Lottery({ participants, onResult }) {
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle | rolling | revealed
  const [winners, setWinners] = useState([]); // confirmed (각자 stop된 순서대로)
  const [rollingNames, setRollingNames] = useState([]); // 각 슬롯 현재 표시 이름
  const mountedRef = useRef(true);
  const timersRef = useRef([]);
  const intervalsRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const hasTicketMode = participants.some((p) => (p.tickets || 0) > 0);
  const eligibleParticipants = hasTicketMode
    ? participants.filter((p) => (p.tickets || 0) > 0)
    : participants;
  const totalTickets = eligibleParticipants.reduce((sum, p) => sum + (p.tickets || 0), 0);

  // 슬롯 개수 (rolling 중) — count 만큼 모두 즉시 등장해서 동시에 회전, stagger로 stop
  const slotCount = phase === 'idle' ? 0 : count;

  function draw() {
    if (phase === 'rolling' || participants.length === 0) return;

    // 1) 미리 winner 결정
    const normalizedCount = Number.isFinite(count) && count > 0 ? count : 1;
    const { winners: picked } = pickLotteryWinners(participants, normalizedCount);
    if (picked.length === 0) return;

    setPhase('rolling');
    setWinners([]);
    setRollingNames(picked.map(() => participants[0]?.nickname || '...'));

    // 2) 각 슬롯 빠르게 이름 회전 (slot machine — 80ms 간격)
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timersRef.current = [];
    intervalsRef.current = [];

    picked.forEach((_, slotIdx) => {
      const interval = setInterval(() => {
        if (!mountedRef.current) return;
        const r = participants[Math.floor(Math.random() * participants.length)];
        setRollingNames((prev) => prev.map((n, i) => (i === slotIdx ? r.nickname : n)));
      }, 80);
      intervalsRef.current.push(interval);
    });

    // 3) 각 슬롯을 stagger로 stop (첫 슬롯 1.6초, 그 다음 +0.7초씩 — 점점 긴장감)
    picked.forEach((winner, slotIdx) => {
      const stopAt = 1600 + slotIdx * 700;
      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        clearInterval(intervalsRef.current[slotIdx]);
        setWinners((prev) => {
          const next = [...prev];
          next[slotIdx] = winner;
          return next;
        });
        setRollingNames((prev) => prev.map((n, i) => (i === slotIdx ? winner.nickname : n)));
        if (slotIdx === picked.length - 1) {
          setPhase('revealed');
          onResult?.(picked.map((w) => w.nickname));
        }
      }, stopAt);
      timersRef.current.push(timer);
    });
  }

  function reset() {
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    setPhase('idle');
    setWinners([]);
    setRollingNames([]);
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Ticket size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {hasTicketMode ? '보상 추첨' : '제비뽑기'}
        </h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  const revealedCount = winners.filter(Boolean).length;
  const isRolling = phase === 'rolling';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
      {/* Count selector — rolling 중에는 숨김 */}
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm font-medium">추첨 인원</span>
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <button onClick={() => setCount(Math.max(1, count - 1))} aria-label="추첨 인원 감소" className="flex items-center justify-center w-12 h-12 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors duration-150">
              <Minus size={16} />
            </button>
            <input
              type="number"
              min={1}
              max={eligibleParticipants.length}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(eligibleParticipants.length, Number(e.target.value))))}
              aria-label="추첨 인원 수"
              className="w-12 h-12 bg-transparent text-slate-900 dark:text-slate-100 dark:bg-transparent text-center font-bold text-sm focus:outline-none"
            />
            <button onClick={() => setCount(Math.min(eligibleParticipants.length, count + 1))} aria-label="추첨 인원 증가" className="flex items-center justify-center w-12 h-12 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors duration-150">
              <Plus size={16} />
            </button>
          </div>
          <span className="text-slate-400 text-sm">/ {eligibleParticipants.length}명</span>
        </div>
      )}

      {phase === 'idle' && (
        <div className="text-center space-y-1">
          <p className="text-slate-500 text-sm">
            {hasTicketMode ? '퀴즈와 참여로 모은 티켓이 많을수록 당첨 확률이 올라갑니다' : '현재는 균등 추첨으로 진행됩니다'}
          </p>
          {hasTicketMode && (
            <p className="text-slate-600 text-sm font-medium">현재 티켓 총합 {totalTickets}장</p>
          )}
        </div>
      )}

      {/* Rolling 페이즈 텍스트 — 두근두근 안내 */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={18} className="text-amber-500" />
            </motion.div>
            <p className="text-slate-700 dark:text-slate-200 text-lg font-bold tracking-tight">
              두근두근...
            </p>
            <span className="text-slate-400 text-sm tabular-nums">
              {revealedCount}/{count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot cards area — phase별 N개 카드 */}
      <div
        className={`min-h-[280px] px-4 ${
          slotCount >= 4
            ? 'grid grid-cols-2 gap-5 items-center justify-items-center'
            : 'flex flex-wrap gap-5 justify-center items-center'
        }`}
      >
        {slotCount > 0 ? (
          Array.from({ length: slotCount }).map((_, i) => (
            <SlotCard
              key={i}
              index={i}
              color={CARD_COLORS[i % CARD_COLORS.length]}
              rolling={isRolling && !winners[i]}
              displayName={rollingNames[i] || '...'}
              winner={winners[i]}
              hasTicketMode={hasTicketMode}
              isFirst={i === 0}
            />
          ))
        ) : (
          <div className="text-center space-y-2">
            <Ticket size={28} className="text-slate-400 mx-auto" />
            <p className="text-slate-400 text-base">추첨 버튼을 눌러주세요</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {phase === 'revealed' && (
          <Button onClick={reset} variant="secondary" size="lg">
            <RotateCcw size={18} />
            초기화
          </Button>
        )}
        <Button onClick={draw} disabled={isRolling || eligibleParticipants.length === 0} variant="primary" size="lg">
          {isRolling ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={20} />
              </motion.span>
              두근두근...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Ticket size={20} /> {phase === 'revealed' ? '다시 추첨' : hasTicketMode ? '보상 추첨' : '추첨하기'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
