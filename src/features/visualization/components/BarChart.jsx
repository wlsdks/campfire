import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';
import { Check } from 'lucide-react';

export default memo(function BarChart({ sessionId, questionId, options, correctValue = null, revealed = false }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  // Pre-compute counts once so rankMap doesn't depend on the function reference
  const counts = useMemo(
    () => options.map((o) => countByValue(o)),
    [options, countByValue]
  );

  // Rank options by count (descending) to assign color intensity
  const rankMap = useMemo(() => {
    const sorted = [...counts].sort((a, b) => b - a);
    const map = {};
    counts.forEach((c, i) => {
      map[i] = sorted.indexOf(c);
    });
    return map;
  }, [counts]);

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto px-4">
      {options.map((option, i) => {
        const count = counts[i];
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const isCorrect = revealed && correctValue === option;
        const isWrong = revealed && correctValue && correctValue !== option;
        const rank = rankMap[i] || 0;

        // Color by rank: top = darkest
        const barColor = isCorrect
          ? 'bg-indigo-600'
          : isWrong
            ? 'bg-slate-300'
            : rank === 0
              ? 'bg-indigo-500'
              : rank === 1
                ? 'bg-indigo-400'
                : 'bg-indigo-300';

        const countColor = count > 0 && rank === 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400';

        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
            className={`space-y-1.5 ${isCorrect ? 'rounded-lg ring-2 ring-indigo-500/30 p-3 -mx-3 bg-indigo-50/30 dark:bg-indigo-950/30' : ''}`}
          >
            <div className="flex justify-between items-baseline gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isCorrect && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                <span className={`font-medium text-base truncate ${isCorrect ? 'text-indigo-700 dark:text-indigo-400 font-semibold' : isWrong ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {option}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  key={count}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`font-bold text-lg ${isCorrect ? 'text-indigo-700' : countColor}`}
                >
                  {count}
                </motion.span>
                <span className={`text-sm ${isCorrect ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {formatPercent(count, totalVotes)}
                </span>
              </div>
            </div>
            <div className={`h-8 ${isWrong ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-700'} rounded-lg overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.08 }}
                className={`h-full rounded-lg ${barColor}`}
              />
            </div>
          </motion.div>
        );
      })}
      <div className="text-center text-slate-400 text-sm mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        총 <span className="text-slate-600 dark:text-slate-300 font-semibold">{totalVotes}</span>명 투표
      </div>
    </div>
  );
});
