import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';
import { Users } from 'lucide-react';

/**
 * Compact live poll results for student phones.
 * Shows animated horizontal bars with real-time vote counts.
 * Highlights the student's own selection.
 *
 * @param {Object} props
 * @param {string} props.sessionId
 * @param {string} props.questionId
 * @param {string[]} props.options - vote option labels
 * @param {string} props.myAnswer - the option this student voted for
 */
export default memo(function StudentLiveResults({ sessionId, questionId, options, myAnswer }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  const maxCount = useMemo(() => {
    let max = 0;
    options.forEach((o) => {
      const c = countByValue(o);
      if (c > max) max = c;
    });
    return max;
  }, [options, countByValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 28 }}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 tracking-tight">
          실시간 결과
        </p>
        <div className="flex items-center gap-1 text-slate-400">
          <Users size={12} />
          <span className="text-xs font-medium">{totalVotes}</span>
        </div>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const count = countByValue(option);
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isMine = option === myAnswer;

          return (
            <div key={option} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-sm truncate ${
                    isMine
                      ? 'font-semibold text-slate-900'
                      : 'font-medium text-slate-500'
                  }`}
                >
                  {option}
                  {isMine && (
                    <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                      (내 선택)
                    </span>
                  )}
                </span>
                <span
                  className={`text-xs tabular-nums shrink-0 ${
                    isMine ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
                  }`}
                >
                  {formatPercent(count, totalVotes)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(barWidth, count > 0 ? 3 : 0)}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className={`h-full rounded-full ${
                    isMine ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});
