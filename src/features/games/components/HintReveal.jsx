import { useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Eye, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { hapticSuccess, hapticTap } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };
const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 22 };

/**
 * HintReveal — 힌트를 하나씩 공개하고, "정답 보기" 시 폭죽과 함께 정답 표시.
 * 누군지 유추하는 퀴즈용. 강사가 힌트를 하나씩 공개하며 설명.
 *
 * Props:
 * - hints: string[] — 최대 5개 힌트
 * - answer: string — 최종 정답
 * - title: string? — 상단 타이틀 (optional, e.g. "이 사람은 누구일까요?")
 */
export default function HintReveal({ hints = [], answer = '', title = '' }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const maxHints = Math.min(hints.length, 5);

  const revealNextHint = useCallback(() => {
    if (revealedCount < maxHints) {
      hapticTap();
      setRevealedCount(prev => prev + 1);
    }
  }, [revealedCount, maxHints]);

  const revealAnswer = useCallback(() => {
    hapticSuccess();
    setAnswerRevealed(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto px-4">
      {/* Title */}
      {title && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-center"
        >
          {title}
        </motion.p>
      )}

      {/* Hint counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2"
      >
        <Lightbulb size={18} className="text-slate-400" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          힌트 {revealedCount}/{maxHints}
        </span>
      </motion.div>

      {/* Hint cards */}
      <div className="w-full space-y-3">
        {hints.slice(0, maxHints).map((hint, i) => {
          const isRevealed = i < revealedCount;
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
                  <p className="text-base text-slate-300 dark:text-slate-600">???</p>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Answer reveal area */}
      <AnimatePresence mode="wait">
        {answerRevealed ? (
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
              className="text-xs font-semibold text-white/60 dark:text-slate-900/50 uppercase tracking-wider mb-3"
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
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3"
          >
            {revealedCount < maxHints && (
              <Button onClick={revealNextHint} variant="secondary" size="lg">
                <ChevronRight size={20} />
                힌트 공개
              </Button>
            )}
            <Button onClick={revealAnswer} variant="primary" size="lg">
              <Eye size={20} />
              정답 보기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
