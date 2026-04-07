import { memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };
const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 22 };

export default memo(function HintQuizPresenter({ sessionId, questionId, question, revealed }) {
  const { totalVotes } = useVotes(sessionId, questionId);
  const hints = question?.hints || [];
  const revealedHints = question?.revealedHints || 0;
  const answer = question?.correctAnswer || '';
  const acceptableAnswers = question?.acceptableAnswers || [];
  const maxHints = Math.min(hints.length, 5);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto px-4">
      {!revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Lightbulb size={18} className="text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            힌트 {revealedHints}/{maxHints}
          </span>
          {totalVotes > 0 && (
            <span className="text-sm text-slate-400 dark:text-slate-500 ml-2">· {totalVotes}명 답변 중</span>
          )}
        </motion.div>
      )}

      {!revealed && (
        <div className="w-full space-y-3">
          {hints.slice(0, maxHints).map((hint, i) => {
            const isRevealed = i < revealedHints;
            return (
              <AnimatePresence key={i}>
                {isRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ ...SPRING, delay: 0.05 }}
                    className="flex items-start gap-3 p-4 md:p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                      {hint}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="flex items-center gap-3 p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700"
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-base text-slate-300 dark:text-slate-500">???</p>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            key="answer"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={SPRING_BOUNCY}
            className="relative w-full rounded-2xl bg-slate-900 dark:bg-slate-100 p-8 md:p-10 text-center shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-semibold text-white/70 dark:text-slate-500 uppercase tracking-wider mb-3"
            >
              정답
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [0.8, 1.1, 0.95, 1.02, 1] }}
              transition={{ ...SPRING_BOUNCY, delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-white dark:text-slate-900 tracking-tight"
            >
              {answer}
            </motion.p>
            {acceptableAnswers.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 text-sm text-white/60 dark:text-slate-600"
              >
                허용 답변: {acceptableAnswers.join(', ')}
              </motion.p>
            )}
            {totalVotes > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-sm text-white/50 dark:text-slate-500"
              >
                {totalVotes}명 참여
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
