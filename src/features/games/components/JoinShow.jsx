import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useParticipants } from '@/features/participants/api/useParticipants';

function Confetti({ trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const origins = [
      { x: 15 + Math.random()*10, y: 55 + Math.random()*10 },
      { x: 45 + Math.random()*10, y: 40 + Math.random()*10 },
      { x: 75 + Math.random()*10, y: 50 + Math.random()*10 },
    ];
    const p = [];
    origins.forEach((o, oi) => {
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2 + (Math.random() - 0.5);
        const speed = 4 + Math.random() * 8;
        p.push({
          id: `${trigger}-${oi}-${i}`,
          ox: o.x, oy: o.y,
          dx: Math.cos(a) * speed * 60,
          dy: Math.sin(a) * speed * 60 - 180,
          size: 5 + Math.random() * 8,
          color: colors[(oi * 3 + i) % 8],
          delay: oi * 0.15 + Math.random() * 0.12,
          dur: 1.5 + Math.random() * 0.8,
          rot: Math.random() * 600,
          ratio: 0.4 + Math.random() * 0.8,
        });
      }
    });
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (particles.length === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.2, rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          className="absolute rounded-sm"
          // 이동을 x/y(transform)로 — left/top(layout) reflow 제거, 300명 입장 폭죽 90입자 컴포지터 처리
          style={{ left: `${p.ox}%`, top: `${p.oy}%`, width: p.size, height: p.size * p.ratio, backgroundColor: p.color }}
        />
      ))}
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
  const lastMsRef = useRef(0);

  const currentMilestone = count >= 10 ? Math.floor(count / 10) * 10 : 0;

  // 폭죽: 10 단위 마일스톤이 바뀔 때마다
  useEffect(() => {
    if (currentMilestone > lastMsRef.current) {
      setConfettiTrigger(currentMilestone);
      lastMsRef.current = currentMilestone;
    }
  }, [currentMilestone]);

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <Confetti trigger={confettiTrigger} />

      <div className="text-center">
        <p className="text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-2">참여자</p>
        <motion.div key={count} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.15 }}
          className="text-[8rem] md:text-[11rem] lg:text-[14rem] font-black text-slate-900 dark:text-white leading-[0.85] tracking-tighter"
          style={{ textShadow: '0 0 80px rgba(16,185,129,0.12)' }}>
          <Counter value={count} />
        </motion.div>
        <p className="text-slate-400 dark:text-slate-500 text-sm md:text-base mt-2">명 접속 중</p>

        <div className="h-10 mt-3 flex items-center justify-center">
          {currentMilestone > 0 && (
            <motion.p key={currentMilestone}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-emerald-600 dark:text-emerald-400 text-xl md:text-2xl font-black tracking-tight">
              {currentMilestone}명 돌파!
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
});
