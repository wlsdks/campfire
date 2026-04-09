import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

function Confetti({ trigger }) {
  const [on, setOn] = useState(false);
  const prev = useRef(0);
  useEffect(() => {
    if (trigger > prev.current) { setOn(true); setTimeout(() => setOn(false), 2200); prev.current = trigger; }
  }, [trigger]);
  if (!on) return null;
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  // 3개 발사 지점에서 터짐 (좌측, 중앙, 우측)
  const origins = [
    { x: 20, y: 60 },
    { x: 50, y: 45 },
    { x: 80, y: 55 },
  ];
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {origins.map((origin, oi) =>
        Array.from({ length: 25 }, (_, i) => {
          const a = (i / 25) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
          const s = 3 + Math.random() * 6;
          const size = 4 + Math.random() * 7;
          return (
            <motion.div key={`${trigger}-${oi}-${i}`}
              initial={{ left: `${origin.x}%`, top: `${origin.y}%`, opacity: 1, scale: 1 }}
              animate={{
                left: `calc(${origin.x}% + ${Math.cos(a)*s*70}px)`,
                top: `calc(${origin.y}% + ${Math.sin(a)*s*70 - 150}px)`,
                opacity: 0, scale: 0, rotate: Math.random()*500,
              }}
              transition={{ duration: 1+Math.random()*0.5, delay: oi*0.12 + Math.random()*0.1, ease: 'easeOut' }}
              className="absolute rounded-sm"
              style={{ width: size, height: size * (0.5 + Math.random()*0.8), backgroundColor: colors[(oi*8+i)%8] }}
            />
          );
        })
      )}
    </div>
  );
}

function Counter({ value }) {
  const [d, setD] = useState(value);
  const raf = useRef(null);
  const from = useRef(value);
  useEffect(() => {
    const f = from.current, t = value;
    if (f === t) return;
    const dur = Math.min(500, Math.abs(t - f) * 30);
    const st = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - st) / dur);
      setD(Math.round(f + (t - f) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick); else from.current = t;
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span className="tabular-nums">{d}</span>;
}

export default memo(function JoinShow({ sessionId }) {
  const { count } = useParticipants(sessionId);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const peak = useRef(0);

  // 현재 카운트의 10 단위 마일스톤
  const currentMilestone = count >= 10 ? Math.floor(count / 10) * 10 : 0;

  // 폭죽: 새로운 10 단위 돌파 시에만
  useEffect(() => {
    if (count > peak.current) {
      const newMs = Math.floor(count / 10) * 10;
      const oldMs = Math.floor(peak.current / 10) * 10;
      if (newMs > oldMs && newMs > 0) {
        setConfettiTrigger(newMs);
      }
      peak.current = count;
    }
  }, [count]);

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <Confetti trigger={confettiTrigger} />

      <div className="text-center">
        <p className="text-emerald-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-2">참여자</p>
        <motion.div key={count} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.15 }}
          className="text-[8rem] md:text-[11rem] lg:text-[14rem] font-black text-white leading-[0.85] tracking-tighter"
          style={{ textShadow: '0 0 80px rgba(16,185,129,0.12)' }}>
          <Counter value={count} />
        </motion.div>
        <p className="text-slate-500 text-sm md:text-base mt-2">명 접속 중</p>

        <div className="h-10 mt-3 flex items-center justify-center">
          {currentMilestone > 0 && (
            <motion.p key={currentMilestone}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-emerald-400 text-xl md:text-2xl font-black tracking-tight">
              {currentMilestone}명 돌파!
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
});
