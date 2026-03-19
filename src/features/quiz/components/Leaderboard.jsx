import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Flame, Medal, Ticket, Trophy } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

/** Animated number counter — counts from 0 to `value` on mount. */
function AnimatedScore({ value, suffix = '점' }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const displayRef = useRef(null);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = `${v}${suffix}`;
    });
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded, suffix]);

  return <span ref={displayRef}>{value}{suffix}</span>;
}

const PODIUM_STYLES = [
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-slate-50 text-slate-600 border-slate-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

export default function Leaderboard({
  entries,
  maxShow = 10,
  title = '리더보드',
  emptyLabel = '아직 점수가 없습니다',
  highlightId = null,
}) {
  const visible = entries.slice(0, maxShow);

  if (visible.length === 0) {
    return (
      <div className="text-center py-8 text-slate-300 text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-amber-500" />
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>

      {visible.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          layout
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            i < 3 ? PODIUM_STYLES[i] : 'bg-white border-slate-100'
          } ${
            entry.id === highlightId ? 'ring-2 ring-indigo-200 border-indigo-200' : ''
          }`}
        >
          <span className={`w-6 text-center font-bold text-sm ${i < 3 ? '' : 'text-slate-400'}`}>
            {i === 0 ? <Medal size={16} className="text-amber-500 mx-auto" /> : i + 1}
          </span>
          <Avatar name={entry.nickname} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate block">{entry.nickname}</span>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              {(entry.tickets || 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Ticket size={12} />
                  {entry.tickets}
                </span>
              )}
              {(entry.streak || 0) > 1 && (
                <span className="inline-flex items-center gap-1">
                  <Flame size={12} />
                  {entry.streak}연속
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-indigo-600 block">
              <AnimatedScore value={entry.total} />
            </span>
            {entry.lastPoints > 0 && (
              <span className="text-xs text-emerald-500 font-medium">+{entry.lastPoints}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
