import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { Check, X } from 'lucide-react';

/** Renders the sentence with the blank highlighted. */
function SentenceDisplay({ title, correctAnswer, revealed }) {
  const parts = title.split('___');
  return (
    <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed text-center">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
              className={`inline-block mx-1 px-3 py-1 rounded-lg text-lg font-bold tracking-tight border-b-2 ${
                revealed
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-500'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-300 border-dashed border-slate-300 dark:border-slate-500'
              }`}
            >
              {revealed ? correctAnswer : '???'}
            </motion.span>
          )}
        </span>
      ))}
    </p>
  );
}

export default memo(function FillBlankChart({ sessionId, questionId, title, correctAnswer, revealed = false }) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);

  const { correctCount, topAnswers } = useMemo(() => {
    const freq = {};
    let correct = 0;
    const normalizedCorrect = (correctAnswer || '').trim().toLowerCase();

    voteList.forEach((v) => {
      const raw = (v.value || '').trim();
      if (!raw) return;
      const normalized = raw.toLowerCase();
      // Group by display form (first seen casing wins)
      const existing = Object.keys(freq).find((k) => k.toLowerCase() === normalized);
      const key = existing || raw;
      freq[key] = (freq[key] || 0) + 1;
      if (normalizedCorrect && normalized === normalizedCorrect) correct++;
    });

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([answer, count]) => ({
        answer,
        count,
        isCorrect: normalizedCorrect && answer.toLowerCase() === normalizedCorrect,
      }));

    return { correctCount: correct, topAnswers: sorted };
  }, [voteList, correctAnswer]);

  const correctPct = totalVotes > 0 ? Math.round((correctCount / totalVotes) * 100) : 0;
  const maxCount = topAnswers.length > 0 ? topAnswers[0].count : 1;

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto px-8">
      {/* Sentence with blank */}
      <SentenceDisplay title={title} correctAnswer={correctAnswer} revealed={revealed} />

      {/* Accuracy hero stat */}
      {correctAnswer && totalVotes > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center space-y-2"
        >
          <motion.p
            key={correctCount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="text-5xl font-black text-slate-900 dark:text-slate-100 tabular-nums"
          >
            {correctPct}%
          </motion.p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            정답률 ({correctCount}/{totalVotes}명)
          </p>
        </motion.div>
      )}

      {/* Answer frequency bars */}
      {topAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {topAnswers.slice(0, 10).map((a, i) => {
              const widthPct = Math.max(8, (a.count / maxCount) * 100);
              return (
                <motion.div
                  key={a.answer}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="relative h-9 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <motion.div
                        animate={{ width: `${widthPct}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className={`absolute inset-y-0 left-0 rounded-lg ${
                          revealed && a.isCorrect ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                      />
                      <div className="absolute inset-0 flex items-center px-3 gap-2">
                        {revealed && a.isCorrect && (
                          <Check size={14} className="text-white shrink-0" />
                        )}
                        {revealed && !a.isCorrect && correctAnswer && (
                          <X size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          revealed && a.isCorrect ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {a.answer}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-500 tabular-nums w-8 text-right shrink-0">
                    {a.count}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Total */}
      <div className="text-center text-slate-400 dark:text-slate-500 text-sm pt-2 border-t border-slate-100 dark:border-slate-700">
        <span className="text-slate-600 dark:text-slate-300 font-semibold">{totalVotes}</span>명 응답
      </div>
    </div>
  );
});
