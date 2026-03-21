import { memo, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/** Animated number counter for live view. */
function AnimatedNumber({ value, className }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef(null);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    const controls = animate(motionVal, value, {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => { controls.stop(); unsub(); };
  }, [value, motionVal, rounded]);

  return <span ref={ref} className={className}>{value}</span>;
}

export default memo(function LiveParticipation({ voted, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">참여</span>
        <div className="flex items-baseline gap-2">
          <span className="text-slate-100 tabular-nums">
            <AnimatedNumber value={voted} className="text-2xl font-bold" />
            <span className="text-sm text-slate-500 ml-0.5">/ {total}명</span>
          </span>
          <span className="text-lg font-bold text-indigo-400 tabular-nums">
            <AnimatedNumber value={pct} className="" />%
          </span>
        </div>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>
    </div>
  );
});
