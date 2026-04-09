import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

function Confetti({ trigger }) {
  const [on, setOn] = useState(false);
  const prev = useRef(0);
  useEffect(() => {
    if (trigger > prev.current) { setOn(true); setTimeout(() => setOn(false), 1500); prev.current = trigger; }
  }, [trigger]);
  if (!on) return null;
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {Array.from({ length: 35 }, (_, i) => {
        const a = (i / 35) * Math.PI * 2 + Math.random() * 0.5;
        const s = 3 + Math.random() * 4;
        return (
          <motion.div key={`${trigger}-${i}`}
            initial={{ left: '50%', top: '50%', opacity: 1, scale: 1 }}
            animate={{ left: `calc(50% + ${Math.cos(a)*s*55}px)`, top: `calc(50% + ${Math.sin(a)*s*55 - 120}px)`, opacity: 0, scale: 0, rotate: Math.random()*400 }}
            transition={{ duration: 1+Math.random()*0.3, delay: Math.random()*0.1, ease: 'easeOut' }}
            className="absolute w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: colors[i%6] }}
          />
        );
      })}
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
  const [ms, setMs] = useState(0);
  const peak = useRef(0);

  useEffect(() => {
    if (count > peak.current) {
      peak.current = count;
      const m = Math.floor(count / 10) * 10;
      if (m > 0 && m > ms) setMs(m);
    }
  }, [count, ms]);

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <Confetti trigger={ms} />

      <div className="text-center">
        <p className="text-emerald-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-2">참여자</p>
        <motion.div key={count} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.15 }}
          className="text-[8rem] md:text-[11rem] lg:text-[14rem] font-black text-white leading-[0.85] tracking-tighter"
          style={{ textShadow: '0 0 80px rgba(16,185,129,0.12)' }}>
          <Counter value={count} />
        </motion.div>
        <p className="text-slate-500 text-sm md:text-base mt-2">명 접속 중</p>

        <div className="h-10 mt-3">
          <AnimatePresence mode="wait">
            {ms > 0 && ms === Math.floor(count / 10) * 10 && (
              <motion.p key={ms}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-emerald-400 text-xl md:text-2xl font-black tracking-tight">
                {ms}명 돌파!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
