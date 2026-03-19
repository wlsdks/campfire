import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
        >
          <Check size={32} className="text-slate-800" strokeWidth={2.5} />
        </motion.div>

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
