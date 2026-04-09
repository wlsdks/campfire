import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

const NAME_TTL = 2800;
const MAX_PER_SIDE = 6;

/** Single name tag */
const NameTag = memo(function NameTag({ name, side }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: side === 'left' ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === 'left' ? -8 : 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`py-0.5 ${side === 'left' ? 'text-right' : 'text-left'}`}
    >
      <span className="text-white/60 text-sm font-medium">{name}</span>
    </motion.div>
  );
});

/** Confetti */
function Confetti({ trigger }) {
  const [on, setOn] = useState(false);
  const prevRef = useRef(0);
  useEffect(() => {
    if (trigger > prevRef.current) { setOn(true); setTimeout(() => setOn(false), 1600); prevRef.current = trigger; }
  }, [trigger]);
  if (!on) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: 35 }, (_, i) => {
        const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
        const a = (i / 35) * Math.PI * 2 + Math.random() * 0.5;
        const s = 3 + Math.random() * 4;
        return (
          <motion.div key={`${trigger}-${i}`}
            initial={{ left: '50%', top: '50%', opacity: 1, scale: 1 }}
            animate={{ left: `calc(50% + ${Math.cos(a) * s * 50}px)`, top: `calc(50% + ${Math.sin(a) * s * 50 - 120}px)`, opacity: 0, scale: 0, rotate: Math.random() * 400 }}
            transition={{ duration: 1 + Math.random() * 0.4, delay: Math.random() * 0.1, ease: 'easeOut' }}
            className="absolute w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: colors[i % 6] }}
          />
        );
      })}
    </div>
  );
}

/** Smooth counter */
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
  const { onlineList, count } = useParticipants(sessionId);
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  const [ms, setMs] = useState(0);
  const prev = useRef(null);
  const id = useRef(0);
  const side = useRef(0);
  const peak = useRef(0);

  // Only track NEW joins (skip initial load)
  useEffect(() => {
    const names = new Set(onlineList.map(p => p.nickname));
    if (prev.current === null) { prev.current = names; peak.current = count; return; }
    const now = Date.now();
    names.forEach(n => {
      if (!prev.current.has(n)) {
        const e = { id: ++id.current, name: n, t: now };
        if (side.current++ % 2 === 0) setLeft(p => [...p.slice(-(MAX_PER_SIDE - 1)), e]);
        else setRight(p => [...p.slice(-(MAX_PER_SIDE - 1)), e]);
      }
    });
    prev.current = names;
  }, [onlineList, count]);

  // Milestone
  useEffect(() => {
    if (count > peak.current) {
      peak.current = count;
      const m = Math.floor(count / 10) * 10;
      if (m > 0 && m > ms) setMs(m);
    }
  }, [count, ms]);

  // Cleanup
  useEffect(() => {
    const t = setInterval(() => {
      const c = Date.now() - NAME_TTL;
      setLeft(p => { const n = p.filter(e => e.t > c); return n.length === p.length ? p : n; });
      setRight(p => { const n = p.filter(e => e.t > c); return n.length === p.length ? p : n; });
    }, 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full relative select-none" onClick={e => e.stopPropagation()}>
      <Confetti trigger={ms} />

      {/* Center counter — absolute, always centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center">
          <p className="text-emerald-400 text-xs font-bold tracking-[0.15em] uppercase mb-1">참여자</p>
          <motion.div key={count} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.2 }}
            className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-black text-white leading-none tracking-tighter"
            style={{ textShadow: '0 0 80px rgba(16,185,129,0.12)' }}>
            <Counter value={count} />
          </motion.div>
          <p className="text-slate-500 text-sm mt-1">명 접속 중</p>
          <AnimatePresence>
            {ms > 0 && ms === Math.floor(count / 10) * 10 && (
              <motion.p key={ms}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-emerald-400 text-xl md:text-2xl font-black mt-2 tracking-tight">
                {ms}명 돌파!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Left names — absolute left */}
      <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 w-32 md:w-40 z-10">
        <AnimatePresence mode="popLayout">
          {left.map(e => <NameTag key={e.id} name={e.name} side="left" />)}
        </AnimatePresence>
      </div>

      {/* Right names — absolute right */}
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 w-32 md:w-40 z-10">
        <AnimatePresence mode="popLayout">
          {right.map(e => <NameTag key={e.id} name={e.name} side="right" />)}
        </AnimatePresence>
      </div>
    </div>
  );
});
