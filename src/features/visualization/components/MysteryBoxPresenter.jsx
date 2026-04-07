import { memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';
import { useEffect, useRef, useState } from 'react';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 22 };

/**
 * MysteryBoxPresenter — 프레젠터/라이브 뷰 전용.
 * 정답 공개 전: 빙글빙글 돌아가는 미스터리 박스
 * 정답 공개 후: 폭죽 + 정답 + 응답 분포
 */
export default memo(function MysteryBoxPresenter({ sessionId, questionId, question, revealed }) {
  const { totalVotes } = useVotes(sessionId, questionId);
  const items = question?.mysteryItems?.length > 0 ? question.mysteryItems : ['?', '??', '???'];
  const answer = question?.correctAnswer || '';
  const reasons = question?.answerReasons || [];

  const textRef = useRef(null);
  const intervalRef = useRef(null);

  // Spin animation — DOM direct for smooth cycling
  useEffect(() => {
    if (!revealed && items.length > 0) {
      let idx = 0;
      intervalRef.current = setInterval(() => {
        if (textRef.current) {
          textRef.current.textContent = items[idx % items.length];
          idx++;
        }
      }, 90);
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [revealed, items]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="spinning"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={SPRING_BOUNCY}
            className="relative"
          >
            {/* Spinning box */}
            <motion.div
              animate={{ rotate: [0, -1, 1, -1, 0], scale: [1, 1.02, 0.98, 1.02, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <HelpCircle size={40} className="text-slate-300 dark:text-slate-600" />
              </motion.div>
              <span
                ref={textRef}
                className="text-2xl md:text-3xl font-bold text-slate-400 dark:text-slate-500 tabular-nums min-h-[2.5rem] text-center px-4 mt-2"
              >?</span>
            </motion.div>

            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-slate-200 dark:border-slate-600"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />

            {/* Vote count */}
            {totalVotes > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-slate-400 whitespace-nowrap"
              >
                {totalVotes}명 답변 중
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
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
            {reasons.length > 0 && (
              <div className="mt-4 space-y-1">
                {reasons.map((r, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="text-sm text-white/50 dark:text-slate-900/50"
                  >{r}</motion.p>
                ))}
              </div>
            )}
            {totalVotes > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-sm text-white/40 dark:text-slate-900/40"
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
