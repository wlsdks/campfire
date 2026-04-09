import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

const NAME_TTL = 2800;
const MAX_PER_SIDE = 6;
const CLEANUP_INTERVAL = 400;

/** Single name — subtle slide in */
const NameTag = memo(function NameTag({ name, side }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === 'left' ? -10 : 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`py-0.5 ${side === 'left' ? 'text-right' : 'text-left'}`}
    >
      <span className="text-white/70 text-sm md:text-base font-semibold">{name}</span>
    </motion.div>
  );
});

/** Confetti burst for milestones */
function Confetti({ trigger }) {
  const [active, setActive] = useState(false);
  const prevRef = useRef(0);

  useEffect(() => {
    if (trigger > prevRef.current && trigger > 0) {
      setActive(true);
      const t = setTimeout(() => setActive(false), 1800);
      prevRef.current = trigger;
      return () => clearTimeout(t);
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 40 }, (_, i) => {
        const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
        const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.5;
        const speed = 3 + Math.random() * 5;
        const dx = Math.cos(angle) * speed * 60;
        const dy = Math.sin(angle) * speed * 60 - 150;
        return (
          <motion.div
            key={`${trigger}-${i}`}
            initial={{ left: '50%', top: '45%', opacity: 1, scale: 1 }}
            animate={{
              left: `calc(50% + ${dx}px)`,
              top: `calc(45% + ${dy}px)`,
              opacity: 0,
              scale: 0.2,
              rotate: Math.random() * 540,
            }}
            transition={{ duration: 1.2 + Math.random() * 0.5, delay: Math.random() * 0.15, ease: 'easeOut' }}
            className="absolute w-2 h-2 rounded-sm"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        );
      })}
    </div>
  );
}

/** Smooth counter */
function Counter({ value }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const dur = Math.min(600, Math.abs(to - from) * 40);
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

export default memo(function JoinShow({ sessionId }) {
  const { onlineList, count } = useParticipants(sessionId);
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  const [milestone, setMilestone] = useState(0);
  const prevNamesRef = useRef(null); // null = not initialized
  const idRef = useRef(0);
  const sideRef = useRef(0);
  const peakRef = useRef(0);

  // Skip initial load — only track NEW joins after first render
  useEffect(() => {
    const names = new Set(onlineList.map(p => p.nickname));

    // First load: just record, don't show
    if (prevNamesRef.current === null) {
      prevNamesRef.current = names;
      peakRef.current = count;
      return;
    }

    // Find truly new names
    const newNames = [];
    names.forEach(n => {
      if (!prevNamesRef.current.has(n)) newNames.push(n);
    });
    prevNamesRef.current = names;

    if (newNames.length === 0) return;

    const now = Date.now();
    newNames.forEach(name => {
      const entry = { id: ++idRef.current, name, t: now };
      if (sideRef.current++ % 2 === 0) {
        setLeft(prev => [...prev.slice(-(MAX_PER_SIDE - 1)), entry]);
      } else {
        setRight(prev => [...prev.slice(-(MAX_PER_SIDE - 1)), entry]);
      }
    });
  }, [onlineList, count]);

  // Milestone — only on real increase past round number
  useEffect(() => {
    if (count > peakRef.current) {
      peakRef.current = count;
      const ms = Math.floor(count / 10) * 10;
      if (ms > 0 && ms > milestone && count >= ms) {
        setMilestone(ms);
      }
    }
  }, [count, milestone]);

  // Cleanup expired
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - NAME_TTL;
      setLeft(prev => { const next = prev.filter(e => e.t > cutoff); return next.length === prev.length ? prev : next; });
      setRight(prev => { const next = prev.filter(e => e.t > cutoff); return next.length === prev.length ? prev : next; });
    }, CLEANUP_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center select-none" onClick={e => e.stopPropagation()}>
      <Confetti trigger={milestone} />

      <div className="flex items-center w-full max-w-4xl px-8">
        {/* Left names */}
        <div className="flex-1 flex flex-col justify-center items-end pr-8 min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {left.map(e => <NameTag key={e.id} name={e.name} side="left" />)}
          </AnimatePresence>
        </div>

        {/* Center */}
        <div className="shrink-0 text-center">
          <p className="text-emerald-400 text-xs font-bold tracking-[0.15em] uppercase mb-1">참여자</p>
          <motion.div
            key={count}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.2 }}
            className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-black text-white leading-none tracking-tighter"
            style={{ textShadow: '0 0 80px rgba(16,185,129,0.15)' }}
          >
            <Counter value={count} />
          </motion.div>
          <p className="text-slate-500 text-sm mt-1">명 접속 중</p>

          <AnimatePresence>
            {milestone > 0 && milestone === Math.floor(count / 10) * 10 && (
              <motion.p
                key={milestone}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-emerald-400 text-xl md:text-2xl font-black mt-3 tracking-tight"
              >
                {milestone}명 돌파!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right names */}
        <div className="flex-1 flex flex-col justify-center items-start pl-8 min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {right.map(e => <NameTag key={e.id} name={e.name} side="right" />)}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
