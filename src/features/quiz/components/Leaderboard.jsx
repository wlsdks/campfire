import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, memo } from 'react';
import { ChevronUp, ChevronDown, Flame, Medal, Ticket, Trophy } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

/** Animated number counter — counts from prev to `value` on change. */
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

/** Shows rank change arrow with number. */
function RankChange({ delta }) {
  if (delta === 0) return null;
  const isUp = delta > 0;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`inline-flex items-center text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}
    >
      {isUp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      {Math.abs(delta)}
    </motion.span>
  );
}

const PODIUM_STYLES = [
  'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100',
  'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600',
  'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
];

/** Single leaderboard row — extracted for clarity. */
function LeaderboardRow({ entry, rank, isHighlighted, isPodium, podiumIndex, rankDelta }) {
  const podiumStyle = isPodium ? PODIUM_STYLES[podiumIndex] : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700';
  const highlightStyle = isHighlighted && !isPodium
    ? 'ring-2 ring-slate-900/20 dark:ring-slate-400/30 border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-700'
    : isHighlighted && isPodium
      ? 'ring-2 ring-white/30'
      : '';

  return (
    <motion.div
      layout
      layoutId={entry.id}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 28 },
        delay: rank * 0.04,
        type: 'spring',
        stiffness: 300,
        damping: 26,
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${podiumStyle} ${highlightStyle}`}
    >
      {/* Rank number / medal */}
      <span className={`w-6 text-center font-bold text-sm shrink-0 ${rank < 3 ? '' : 'text-slate-400'}`}>
        {rank === 0 ? <Medal size={16} className="text-white dark:text-slate-900 mx-auto" /> : rank + 1}
      </span>

      <Avatar name={entry.nickname} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{entry.nickname}</span>
          {isHighlighted && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              rank === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'
            }`}>나</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          {rankDelta !== 0 && <RankChange delta={rankDelta} />}
          {(entry.streak || 0) > 1 && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${
              (entry.streak || 0) >= 3 ? 'text-amber-600' : ''
            }`}>
              <Flame size={12} />
              {entry.streak}연속
            </span>
          )}
          {(entry.tickets || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Ticket size={12} />
              {entry.tickets}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`font-bold block ${rank === 0 ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
          <AnimatedScore value={entry.total} />
        </span>
        <AnimatePresence mode="popLayout">
          {entry.lastPoints > 0 && (
            <motion.span
              key={`pts-${entry.lastPoints}-${entry.lastQuestionId}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className={`text-xs font-medium ${rank === 0 ? 'text-white/70' : 'text-slate-400'}`}
            >
              +{entry.lastPoints}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default memo(function Leaderboard({
  entries,
  maxShow = 10,
  title = '리더보드',
  emptyLabel = '아직 점수가 없습니다',
  highlightId = null,
}) {
  const visible = entries.slice(0, maxShow);

  // Track previous ranks for rank-change indicators
  const prevRanksRef = useRef({});
  const rankDeltas = useRef({});

  useEffect(() => {
    const newRanks = {};
    entries.forEach((entry, i) => { newRanks[entry.id] = i; });

    const prev = prevRanksRef.current;
    const deltas = {};
    entries.forEach((entry, i) => {
      if (prev[entry.id] !== undefined) {
        // positive delta = moved up (lower index = better rank)
        deltas[entry.id] = prev[entry.id] - i;
      }
    });
    rankDeltas.current = deltas;
    prevRanksRef.current = newRanks;
  }, [entries]);

  if (visible.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Trophy size={32} className="text-slate-200 dark:text-slate-600 mx-auto" />
        <p className="text-slate-400 text-sm">{emptyLabel}</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">퀴즈에 정답을 맞히면 점수가 올라갑니다</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex items-center gap-2 mb-4"
        >
          <Trophy size={20} className="text-slate-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        </motion.div>
      )}

      {visible.map((entry, i) => (
        <LeaderboardRow
          key={entry.id}
          entry={entry}
          rank={i}
          isHighlighted={entry.id === highlightId}
          isPodium={i < 3}
          podiumIndex={i}
          rankDelta={rankDeltas.current[entry.id] || 0}
        />
      ))}
    </div>
  );
});
