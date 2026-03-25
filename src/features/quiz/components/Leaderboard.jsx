import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';
import LeaderboardRow from './LeaderboardRow';

export default memo(function Leaderboard({
  entries,
  maxShow = 10,
  title = '리더보드',
  emptyLabel = '아직 점수가 없습니다',
  highlightId = null,
}) {
  const visible = entries.slice(0, maxShow);

  // Track previous ranks for rank-change indicators — state for reactivity
  const prevRanksRef = useRef({});
  const [rankDeltas, setRankDeltas] = useState({});

  const computeDeltas = useCallback(() => {
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

    prevRanksRef.current = newRanks;
    setRankDeltas(deltas);
  }, [entries]);

  useEffect(() => {
    computeDeltas();
  }, [computeDeltas]);

  if (visible.length === 0) {
    return (
      <div className="text-center py-10 space-y-2 flex flex-col items-center">
        <PickMascot size="sm" />
        <p className="text-slate-400 text-sm">{emptyLabel}</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">퀴즈에 정답을 맞히면 점수가 올라갑니다</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-center gap-2 mb-4"
        >
          <Trophy size={20} className="text-slate-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {visible.map((entry, i) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={i}
            isHighlighted={entry.id === highlightId}
            isPodium={i < 3}
            podiumIndex={i}
            rankDelta={rankDeltas[entry.id] || 0}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
