import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function VoteConfirm({
  submittedLabel = '투표 완료!',
  waitingLabel = '결과를 기다리는 중...',
  submittedDescription = '응답이 기록되었습니다',
  waitingDescription = '강사가 다음 단계를 진행하면 표시됩니다',
}) {
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
      className="w-full rounded-[28px] border border-[#d8d0c2] bg-[linear-gradient(180deg,#fffdfa_0%,#f4efe7_100%)] px-5 py-6 shadow-[0_20px_38px_rgba(41,37,36,0.08)]"
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[22px] border border-[#bdd5c7] bg-[#e6f0e8]"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[#2f5c45]"
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

        <div className="space-y-2 text-center">
          <motion.p
            key={waiting ? 'waiting' : 'done'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[26px] font-bold tracking-[-0.03em] text-[#264f3b]"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <p className="text-sm leading-relaxed text-slate-500">
            {waiting ? '잠시 후 강사가 다음 단계를 진행하면 상태가 바뀝니다.' : submittedDescription}
          </p>
        </div>

        <div className="w-full rounded-[20px] border border-[#dad2c6] bg-white/80 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">현재 상태</p>
          <p className="mt-1 text-sm text-slate-700">
            {waiting ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Clock size={14} />
                {waitingDescription}
              </span>
            ) : submittedDescription}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
