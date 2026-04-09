import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

const NAME_VISIBLE_MS = 3500;
const MAX_VISIBLE_PER_SIDE = 8;

/** Single name row — slides in from the side */
const NameRow = memo(function NameRow({ name, side, delay = 0 }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay }}
      className={`flex items-center gap-2 py-1 ${isLeft ? 'justify-end' : 'justify-start'}`}
    >
      <span className="text-emerald-400/80 text-xs font-mono font-bold">+1</span>
      <span className="text-white/90 text-base md:text-lg font-bold tracking-tight truncate max-w-[120px]">
        {name}
      </span>
    </motion.div>
  );
});

/** Milestone celebration — confetti particles */
function ConfettiParticles({ trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: `${trigger}-${i}`,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 40 + (Math.random() - 0.5) * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      angle: Math.random() * 360,
      speed: 2 + Math.random() * 4,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.speed * 100;
        const dy = Math.sin(rad) * p.speed * 100 - 200;
        return (
          <motion.div
            key={p.id}
            initial={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              left: `${p.x + dx / 5}%`,
              top: `${p.y - dy / 10}%`,
              opacity: 0,
              scale: 0.3,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{ duration: 1.5 + Math.random(), delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size * (0.6 + Math.random() * 0.8),
              backgroundColor: p.color,
            }}
          />
        );
      })}
    </div>
  );
}

/** Milestone flash text */
function MilestoneFlash({ count }) {
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (count > 0 && count % 10 === 0) {
      setMilestone(count);
      const t = setTimeout(() => setMilestone(null), 2000);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key={milestone}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            {milestone}명 돌파!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Big animated counter with spring */
function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef(display);

  useEffect(() => {
    if (value === startRef.current) return;
    const from = startRef.current;
    const to = value;
    const duration = Math.min(800, Math.abs(to - from) * 60);
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

export default memo(function JoinShow({ sessionId }) {
  const { onlineList, count } = useParticipants(sessionId);
  const [leftQueue, setLeftQueue] = useState([]);
  const [rightQueue, setRightQueue] = useState([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const prevNamesRef = useRef(new Set());
  const queueIdRef = useRef(0);
  const prevCountRef = useRef(0);
  const sideToggle = useRef(0);

  // Detect milestone (every 10)
  useEffect(() => {
    if (count > 0 && count % 10 === 0 && count > prevCountRef.current) {
      setConfettiTrigger(count);
    }
    prevCountRef.current = count;
  }, [count]);

  // Detect new joins → alternate left/right queue
  useEffect(() => {
    const currentNames = new Set(onlineList.map(p => p.nickname));
    const newNames = [];

    onlineList.forEach(p => {
      if (!prevNamesRef.current.has(p.nickname)) {
        newNames.push(p.nickname);
      }
    });

    if (newNames.length > 0) {
      const now = Date.now();
      newNames.forEach((name, i) => {
        const entry = { id: ++queueIdRef.current, name, addedAt: now + i * 80 };
        if (sideToggle.current % 2 === 0) {
          setLeftQueue(prev => [...prev, entry].slice(-MAX_VISIBLE_PER_SIDE * 2));
        } else {
          setRightQueue(prev => [...prev, entry].slice(-MAX_VISIBLE_PER_SIDE * 2));
        }
        sideToggle.current++;
      });
    }

    prevNamesRef.current = currentNames;
  }, [onlineList]);

  // Cleanup expired entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLeftQueue(prev => prev.filter(e => now - e.addedAt < NAME_VISIBLE_MS));
      setRightQueue(prev => prev.filter(e => now - e.addedAt < NAME_VISIBLE_MS));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Initial burst on mount
  const initialRef = useRef(false);
  useEffect(() => {
    if (initialRef.current || onlineList.length === 0) return;
    initialRef.current = true;
    const now = Date.now();
    onlineList.forEach((p, i) => {
      const entry = { id: ++queueIdRef.current, name: p.nickname, addedAt: now + i * 60 };
      if (i % 2 === 0) {
        setLeftQueue(prev => [...prev, entry].slice(-MAX_VISIBLE_PER_SIDE));
      } else {
        setRightQueue(prev => [...prev, entry].slice(-MAX_VISIBLE_PER_SIDE));
      }
    });
    prevNamesRef.current = new Set(onlineList.map(p => p.nickname));
  }, [onlineList]);

  const visibleLeft = leftQueue.slice(-MAX_VISIBLE_PER_SIDE);
  const visibleRight = rightQueue.slice(-MAX_VISIBLE_PER_SIDE);

  return (
    <div className="w-full h-full flex items-center justify-center select-none relative"
      onClick={e => e.stopPropagation()}>

      <ConfettiParticles trigger={confettiTrigger} />

      <div className="flex items-center gap-6 md:gap-10 lg:gap-16 w-full max-w-5xl px-4">
        {/* Left names */}
        <div className="flex-1 flex flex-col justify-center items-end min-h-[300px] overflow-hidden">
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {visibleLeft.map((entry) => (
                <NameRow key={entry.id} name={entry.name} side="left" />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center counter */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <p className="text-emerald-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
            참여자
          </p>
          <div className="relative">
            <motion.div
              key={count}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.25 }}
              className="text-[7rem] md:text-[9rem] lg:text-[11rem] font-black text-white leading-none tracking-tighter"
              style={{
                textShadow: '0 0 60px rgba(16, 185, 129, 0.25), 0 0 120px rgba(16, 185, 129, 0.1)',
              }}
            >
              <AnimatedCounter value={count} />
            </motion.div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 -m-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              }}
            />
          </div>
          <p className="text-slate-500 text-sm">명 접속 중</p>
          <MilestoneFlash count={count} />
        </div>

        {/* Right names */}
        <div className="flex-1 flex flex-col justify-center items-start min-h-[300px] overflow-hidden">
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {visibleRight.map((entry) => (
                <NameRow key={entry.id} name={entry.name} side="right" />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});
