import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';
import { useParticipants } from '@/features/participants/api/useParticipants';

export default memo(function CheckProgress({ sessionId, questionId }) {
  const { totalVotes, voteList } = useVotes(sessionId, questionId);
  const { participants, count } = useParticipants(sessionId);

  const totalParticipants = count || 1;
  const pct = Math.min(100, Math.round((totalVotes / totalParticipants) * 100));

  // Merge nickname from participants, sort by timestamp (most recent first)
  const completedList = useMemo(
    () => [...voteList]
      .map((v) => ({ ...v, nickname: participants[v.id]?.nickname || v.id.slice(0, 6) }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [voteList, participants]
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Big progress number */}
      <div className="text-center space-y-4">
        <div className="flex items-baseline justify-center gap-1">
          <motion.span
            key={totalVotes}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="text-7xl font-black tabular-nums text-slate-900 dark:text-slate-100"
          >
            {totalVotes}
          </motion.span>
          <span className="text-3xl font-bold text-slate-300 dark:text-slate-600">
            / {totalParticipants}
          </span>
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-lg font-medium">
          완료한 학생
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 dark:bg-slate-100 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
        <div className="flex justify-between text-sm text-slate-400 dark:text-slate-500 tabular-nums">
          <span>{pct}% 완료</span>
          <span>{totalParticipants - totalVotes}명 남음</span>
        </div>
      </div>

      {/* Completed avatars list */}
      {completedList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            완료 ({totalVotes}명)
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {completedList.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.03 }}
                  className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-1.5 pr-3 py-1"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                    <Check size={10} className="text-white dark:text-slate-900" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                    {v.nickname}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
});
