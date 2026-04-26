import { useMemo, memo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';
import { Check } from 'lucide-react';

/** Animated counter that smoothly ticks to the target value. */
function AnimatedCount({ value, className }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef({ from: value, to: value, startTime: null });

  useEffect(() => {
    const from = display;
    const to = value;
    if (from === to) return;

    // Cancel any in-flight animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = Math.min(400, Math.abs(to - from) * 40 + 120);
    startRef.current = { from, to, startTime: null };

    function tick(timestamp) {
      if (!startRef.current.startTime) startRef.current.startTime = timestamp;
      const elapsed = timestamp - startRef.current.startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startRef.current.from + (startRef.current.to - startRef.current.from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span className={className}>{display}</span>;
}

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
    <div className="space-y-5 w-full max-w-xl mx-auto px-4">
      {options.map((option, i) => {
        const count = counts[i];
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const isCorrect = revealed && correctValue === option;
        const isWrong = revealed && correctValue && correctValue !== option;
        const rank = rankMap[i] || 0;

        // Color by rank: top = darkest, stronger contrast for projectors
        const barColor = isCorrect
          ? 'bg-indigo-500'
          : isWrong
            ? 'bg-slate-300 dark:bg-slate-600'
            : rank === 0
              ? 'bg-indigo-500'
              : rank === 1
                ? 'bg-indigo-400'
                : 'bg-slate-300 dark:bg-slate-500';

        const countColor = count > 0 && rank === 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400';

        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
            className={`space-y-1.5 transition-opacity duration-300 ${isCorrect ? 'rounded-lg ring-2 ring-indigo-500/30 p-3 -mx-3 bg-slate-50/50 dark:bg-slate-800/50' : isWrong ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-baseline gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isCorrect && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.15 }}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shrink-0"
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                )}
                <span className={`font-medium text-lg lg:text-xl truncate ${isCorrect ? 'text-indigo-700 dark:text-indigo-400 font-semibold' : isWrong ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {option}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <AnimatedCount
                  value={count}
                  className={`font-bold text-2xl lg:text-3xl tabular-nums ${isCorrect ? 'text-indigo-700 dark:text-indigo-400' : countColor}`}
                />
                <span className={`text-sm tabular-nums ${isCorrect ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {formatPercent(count, totalVotes)}
                </span>
              </div>
            </div>
            <div className={`h-11 ${isWrong ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-700'} rounded-lg overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.02 }}
                className={`h-full rounded-lg ${barColor}`}
              />
            </div>
          </motion.div>
        );
      })}
      <div className="text-center text-slate-400 dark:text-slate-500 text-sm mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        총 <AnimatedCount value={totalVotes} className="text-slate-600 dark:text-slate-300 font-semibold tabular-nums" />명 투표
      </div>
    </div>
  );
});
