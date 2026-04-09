import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

const NAME_VISIBLE_MS = 2200;
const MAX_VISIBLE = 12;

/** Single name row — slides up and fades */
const NameRow = memo(function NameRow({ name, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, delay: index * 0.04 }}
      className="flex items-center gap-3 py-1.5"
    >
      <span className="text-emerald-400 text-lg font-mono font-bold tabular-nums w-6 text-right shrink-0">
        +1
      </span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white text-xl md:text-2xl font-bold tracking-tight truncate"
      >
        {name}
      </motion.span>
    </motion.div>
  );
});

/** Big animated counter */
function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef(display);

  useEffect(() => {
    if (value === display) return;
    const from = startRef.current;
    const to = value;
    const duration = Math.min(600, Math.abs(to - from) * 80);
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <motion.span
      key={value}
      className="tabular-nums"
    >
      {display}
    </motion.span>
  );
}

export default memo(function JoinShow({ sessionId }) {
  const { onlineList, count } = useParticipants(sessionId);
  const [nameQueue, setNameQueue] = useState([]);
  const prevNamesRef = useRef(new Set());
  const queueIdRef = useRef(0);

  // Detect new joins and add to queue
  useEffect(() => {
    const currentNames = new Set(onlineList.map(p => p.nickname));
    const newNames = [];

    onlineList.forEach(p => {
      if (!prevNamesRef.current.has(p.nickname)) {
        newNames.push(p.nickname);
      }
    });

    if (newNames.length > 0) {
      const newEntries = newNames.map(name => ({
        id: ++queueIdRef.current,
        name,
        addedAt: Date.now(),
      }));
      setNameQueue(prev => [...prev, ...newEntries].slice(-MAX_VISIBLE * 2));
    }

    prevNamesRef.current = currentNames;
  }, [onlineList]);

  // Clean up old entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNameQueue(prev => prev.filter(e => now - e.addedAt < NAME_VISIBLE_MS));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // On first mount, show all existing participants as a burst
  const initialBurstRef = useRef(false);
  useEffect(() => {
    if (initialBurstRef.current || onlineList.length === 0) return;
    initialBurstRef.current = true;
    // Add existing participants with staggered timestamps
    const entries = onlineList.map((p, i) => ({
      id: ++queueIdRef.current,
      name: p.nickname,
      addedAt: Date.now() + i * 100,
    }));
    setNameQueue(entries.slice(-MAX_VISIBLE));
    prevNamesRef.current = new Set(onlineList.map(p => p.nickname));
  }, [onlineList]);

  const visibleNames = nameQueue.slice(-MAX_VISIBLE);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center gap-8 select-none"
      onClick={e => e.stopPropagation()}>

      {/* Counter */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="text-center space-y-2"
      >
        <p className="text-emerald-400 text-sm md:text-base font-semibold tracking-widest uppercase">
          참여자
        </p>
        <div className="relative">
          <motion.div
            key={count}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-black text-white leading-none tracking-tighter"
            style={{
              textShadow: '0 0 40px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.15)',
            }}
          >
            <AnimatedCounter value={count} />
          </motion.div>
          {/* Glow pulse on new join */}
          <AnimatePresence>
            {nameQueue.length > 0 && nameQueue[nameQueue.length - 1]?.addedAt > Date.now() - 500 && (
              <motion.div
                key="glow"
                initial={{ opacity: 0.6, scale: 0.9 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">명 접속 중</p>
      </motion.div>

      {/* Name scroll */}
      <div className="w-full max-w-md h-[320px] overflow-hidden relative">
        {/* Fade gradients */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

        <div className="flex flex-col justify-end h-full px-4">
          <AnimatePresence mode="popLayout">
            {visibleNames.map((entry, i) => (
              <NameRow key={entry.id} name={entry.name} index={0} />
            ))}
          </AnimatePresence>

          {visibleNames.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-400 dark:text-slate-500 text-sm py-8"
            >
              학생들이 접속하면 여기에 표시됩니다
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
});
