import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { hapticSuccess } from '@/lib/haptics';

function AnimatedCheck() {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      {/* Dark circle scales in with overshoot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ duration: 0.4, times: [0, 0.6, 1], ease: 'easeOut' }}
        className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-full"
      />
      {/* White checkmark draws */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10 w-7 h-7"
      >
        <motion.path
          d="M6 13l4 4L18 7"
          className="stroke-white dark:stroke-slate-900"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
        />
      </motion.svg>
    </div>
  );
}

export default memo(function VoteConfirm({
  submittedLabel = '투표 완료!',
  waitingLabel = '결과를 기다리는 중...',
  submittedDescription = '응답이 기록되었습니다',
  waitingDescription = '강사가 다음 단계를 진행하면 표시됩니다',
  selectedAnswer = null,
  selectedAnswerLabel = '내 응답',
}) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    hapticSuccess();
    const timer = setTimeout(() => setWaiting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <AnimatedCheck />

        <div className="space-y-1 text-center">
          <motion.p
            key={waiting ? 'w' : 'd'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            {waiting ? waitingDescription : submittedDescription}
            {waiting && (
              <span className="flex gap-0.5 ml-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
            )}
          </p>
        </div>

        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-center w-full"
          >
            <p className="text-xs font-medium text-slate-400 mb-1">{selectedAnswerLabel}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedAnswer}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
})
