import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function VoteConfirm() {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaiting(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-5 py-12"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      {/* Text with transition */}
      <div className="text-center space-y-1.5">
        <motion.p
          key={waiting ? 'waiting' : 'done'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-900 text-lg font-bold"
        >
          {waiting ? '결과를 기다리는 중...' : '투표 완료!'}
        </motion.p>
        <p className="text-slate-400 text-sm">
          {waiting ? (
            <span className="flex items-center justify-center gap-1.5">
              <Clock size={14} />
              강사가 다음 단계를 진행하면 표시됩니다
            </span>
          ) : '응답이 기록되었습니다'}
        </p>
      </div>
    </motion.div>
  );
}
