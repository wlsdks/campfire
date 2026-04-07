import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { Check, X } from 'lucide-react';

/**
 * TextAnswerChart — 미스터리 박스 / 힌트 퀴즈용 답변 분포 차트.
 * FillBlankChart에서 SentenceDisplay를 제거하고, 상위 8개만 표시.
 * 화면 높이 내에 맞도록 컴팩트하게 디자인.
 */
export default memo(function TextAnswerChart({ sessionId, questionId, correctAnswer, revealed = false }) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);

  const { correctCount, topAnswers } = useMemo(() => {
    const groupMap = new Map();
    let correct = 0;
    const normalizedCorrect = (correctAnswer || '').trim().toLowerCase();

    voteList.forEach((v) => {
      const raw = (v.value || '').trim();
      if (!raw) return;
      const normalized = raw.toLowerCase();
      const existing = groupMap.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        groupMap.set(normalized, { display: raw, count: 1 });
      }
      if (normalizedCorrect && normalized === normalizedCorrect) correct++;
    });

    const sorted = Array.from(groupMap.values())
      .sort((a, b) => b.count - a.count)
      .map(({ display, count }) => ({
        answer: display,
        count,
        isCorrect: normalizedCorrect && display.toLowerCase() === normalizedCorrect,
      }));

    return { correctCount: correct, topAnswers: sorted };
  }, [voteList, correctAnswer]);

  const correctPct = totalVotes > 0 ? Math.round((correctCount / totalVotes) * 100) : 0;
  const maxCount = topAnswers.length > 0 ? topAnswers[0].count : 1;

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto px-8">
      {/* Status line */}
      {revealed && correctAnswer && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-slate-400 dark:text-slate-500"
        >
          정답: <span className="font-semibold text-slate-700 dark:text-slate-200">{correctAnswer}</span>
        </motion.p>
      )}

      {/* Accuracy stat */}
      {correctAnswer && totalVotes > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center space-y-1"
        >
          <motion.p
            key={correctCount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="text-4xl font-black text-slate-900 dark:text-slate-100 tabular-nums"
          >
            {correctPct}%
          </motion.p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            정답률 ({correctCount}/{totalVotes}명)
          </p>
        </motion.div>
      )}

      {/* Answer bars — max 8 */}
      {topAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-1.5"
        >
          <AnimatePresence mode="popLayout">
            {topAnswers.slice(0, 8).map((a, i) => {
              const widthPct = Math.max(8, (a.count / maxCount) * 100);
              return (
                <motion.div
                  key={a.answer}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <motion.div
                        animate={{ width: `${widthPct}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className={`absolute inset-y-0 left-0 rounded-lg ${
                          revealed && a.isCorrect ? 'bg-slate-800' : 'bg-slate-300 dark:bg-slate-500'
                        }`}
                      />
                      <div className="absolute inset-0 flex items-center px-3 gap-2">
                        {revealed && a.isCorrect && <Check size={13} className="text-white shrink-0" />}
                        {revealed && !a.isCorrect && correctAnswer && <X size={13} className="text-slate-400 shrink-0" />}
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
      <div className="text-center text-slate-400 dark:text-slate-500 text-sm pt-1 border-t border-slate-100 dark:border-slate-700">
        <span className="text-slate-600 dark:text-slate-300 font-semibold">{totalVotes}</span>명 응답
      </div>
    </div>
  );
});
