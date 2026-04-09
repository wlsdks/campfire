import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

const NAME_TTL = 4000;
const MAX_PER_SIDE = 6;

const NameTag = memo(function NameTag({ name, side }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: side === 'left' ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`leading-relaxed ${side === 'left' ? 'text-right' : 'text-left'}`}
    >
      <span className="text-white/50 text-sm font-medium">{name}</span>
    </motion.div>
  );
});

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
      {Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2 + Math.random() * 0.5;
        const s = 2.5 + Math.random() * 4;
        return (
          <motion.div key={`${trigger}-${i}`}
            initial={{ left: '50%', top: '45%', opacity: 1, scale: 1 }}
            animate={{ left: `calc(50% + ${Math.cos(a)*s*55}px)`, top: `calc(45% + ${Math.sin(a)*s*55 - 130}px)`, opacity: 0, scale: 0, rotate: Math.random()*400 }}
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
    const dur = Math.min(400, Math.abs(t - f) * 25);
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

  useEffect(() => {
    if (count > peak.current) {
      peak.current = count;
      const m = Math.floor(count / 10) * 10;
      if (m > 0 && m > ms) setMs(m);
    }
  }, [count, ms]);

  useEffect(() => {
    const t = setInterval(() => {
      const c = Date.now() - NAME_TTL;
      setLeft(p => { const n = p.filter(e => e.t > c); return n.length === p.length ? p : n; });
      setRight(p => { const n = p.filter(e => e.t > c); return n.length === p.length ? p : n; });
    }, 350);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <Confetti trigger={ms} />

      {/* 3-column: left names | counter | right names */}
      <div className="flex items-center gap-6 md:gap-10 w-full max-w-4xl px-4">

        {/* Left */}
        <div className="w-28 md:w-36 shrink-0">
          <AnimatePresence>
            {left.map(e => <NameTag key={e.id} name={e.name} side="left" />)}
          </AnimatePresence>
        </div>

        {/* Center — flex-1 so it stays centered */}
        <div className="flex-1 text-center min-w-0">
          <p className="text-emerald-400 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">참여자</p>
          <motion.div key={count} animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 0.15 }}
            className="text-[7rem] md:text-[9rem] lg:text-[11rem] font-black text-white leading-[0.85] tracking-tighter"
            style={{ textShadow: '0 0 60px rgba(16,185,129,0.1)' }}>
            <Counter value={count} />
          </motion.div>
          <p className="text-slate-500 text-xs md:text-sm mt-1">명 접속 중</p>
          <AnimatePresence>
            {ms > 0 && ms === Math.floor(count / 10) * 10 && (
              <motion.p key={ms}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-emerald-400 text-lg md:text-xl font-black mt-1">
                {ms}명 돌파!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div className="w-28 md:w-36 shrink-0">
          <AnimatePresence>
            {right.map(e => <NameTag key={e.id} name={e.name} side="right" />)}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
