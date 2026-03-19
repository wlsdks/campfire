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
  'bg-slate-900 text-white border-slate-900',
  'bg-slate-100 text-slate-700 border-slate-200',
  'bg-slate-50 text-slate-600 border-slate-200',
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
      <div className="text-center py-10 space-y-2">
        <Trophy size={32} className="text-slate-200 mx-auto" />
        <p className="text-slate-400 text-sm">{emptyLabel}</p>
        <p className="text-slate-300 text-xs">퀴즈에 정답을 맞히면 점수가 올라갑니다</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex items-center gap-2 mb-4"
        >
          <Trophy size={20} className="text-slate-500" />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </motion.div>
      )}

      {visible.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * 0.04,
            type: 'spring',
            stiffness: 300,
            damping: 26,
          }}
          layout
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            i < 3 ? PODIUM_STYLES[i] : 'bg-white border-slate-100'
          } ${
            entry.id === highlightId ? 'ring-2 ring-slate-300 border-slate-300' : ''
          }`}
        >
          <span className={`w-6 text-center font-bold text-sm ${i < 3 ? '' : 'text-slate-400'}`}>
            {i === 0 ? <Medal size={16} className="text-white mx-auto" /> : i + 1}
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
            <span className={`font-bold block ${i === 0 ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedScore value={entry.total} />
            </span>
            {entry.lastPoints > 0 && (
              <span className={`text-xs font-medium ${i === 0 ? 'text-white/70' : 'text-slate-400'}`}>+{entry.lastPoints}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
