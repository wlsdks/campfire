import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function AnimatedCheck() {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      {/* Dark circle scales in */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="absolute inset-0 bg-slate-900 rounded-full"
      />
      {/* White checkmark draws */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10 w-7 h-7"
      >
        <motion.path
          d="M6 13l4 4L18 7"
          stroke="white"
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

export default function VoteConfirm({
  submittedLabel = '투표 완료!',
  waitingLabel = '결과를 기다리는 중...',
  submittedDescription = '응답이 기록되었습니다',
  waitingDescription = '강사가 다음 단계를 진행하면 표시됩니다',
}) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaiting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <AnimatedCheck />

        <div className="space-y-1 text-center">
          <motion.p
            key={waiting ? 'w' : 'd'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-slate-900"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <p className="text-sm text-slate-400">
            {waiting ? waitingDescription : submittedDescription}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
