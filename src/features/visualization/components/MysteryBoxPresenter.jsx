import { memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Trophy } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';
import Avatar from '@/components/ui/Avatar';
import { useEffect, useRef, useMemo } from 'react';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 22 };

export default memo(function MysteryBoxPresenter({ sessionId, questionId, question, revealed }) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);
  const items = useMemo(() => question?.mysteryItems?.length > 0 ? question.mysteryItems : ['?', '??', '???'], [question?.mysteryItems]);
  const answer = question?.correctAnswer || '';
  const reasons = question?.answerReasons || [];

  const winners = useMemo(() => {
    if (!revealed || !answer) return [];
    const normalized = answer.trim().toLowerCase();
    return voteList
      .filter(v => (v.value || '').trim().toLowerCase() === normalized)
      .map(v => v.nickname || '참여자')
      .filter((name, i, arr) => arr.indexOf(name) === i);
  }, [revealed, answer, voteList]);

  const textRef = useRef(null);
  const intervalRef = useRef(null);

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
            <motion.div
              animate={{ rotate: [0, -1, 1, -1, 0], scale: [1, 1.02, 0.98, 1.02, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <HelpCircle size={40} className="text-slate-300 dark:text-slate-500" />
              </motion.div>
              <span
                ref={textRef}
                className="text-2xl md:text-3xl font-bold text-slate-400 dark:text-slate-300 tabular-nums min-h-[2.5rem] text-center px-4 mt-2"
              >?</span>
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-slate-200 dark:border-slate-600"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />

            {totalVotes > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-slate-400 dark:text-slate-500 whitespace-nowrap"
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
            {reasons.length > 0 && (
              <div className="mt-4 space-y-1">
                {reasons.map((r, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="text-sm text-white/60 dark:text-slate-600"
                  >{r}</motion.p>
                ))}
              </div>
            )}
            {/* 당첨자 */}
            {winners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6 pt-5 border-t border-white/10 dark:border-slate-200"
              >
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Trophy size={16} className="text-amber-400 dark:text-amber-500" />
                  <span className="text-xs font-semibold text-white/70 dark:text-slate-500 uppercase tracking-wider">
                    당첨자 {winners.length}명
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {winners.slice(0, 10).map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.9 + i * 0.1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 dark:bg-slate-900/10"
                    >
                      <Avatar name={name} size="xs" />
                      <span className="text-sm font-semibold text-white dark:text-slate-900">{name}</span>
                    </motion.div>
                  ))}
                  {winners.length > 10 && (
                    <span className="text-xs text-white/50 dark:text-slate-500">+{winners.length - 10}명</span>
                  )}
                </div>
              </motion.div>
            )}

            {winners.length === 0 && totalVotes > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-sm text-white/50 dark:text-slate-500"
              >
                {totalVotes}명 참여 · 정답자 없음
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
