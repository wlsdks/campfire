import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';
import { useState, memo } from 'react';
import { Check } from 'lucide-react';
import VoteConfirm from './VoteConfirm';

export default memo(function CheckVoter({ sessionId, questionId, disabled = false }) {
  const [voted, setVoted] = useState(false);

  async function handleCheck() {
    if (disabled || voted) return;
    hapticTap();
    try {
      const pid = getParticipantId();
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value: 'done',
        timestamp: serverTimestamp(),
      });
      setVoted(true);
    } catch (err) {
      logger.error('Check-in failed:', err);
    }
  }

  if (voted) {
    return (
      <VoteConfirm
        submittedLabel="완료 체크!"
        submittedDescription="강사에게 완료가 전달되었습니다"
        waitingLabel="다음 안내를 기다리는 중..."
        waitingDescription="강사가 진행하면 표시됩니다"
        selectedAnswer="완료"
      />
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCheck}
      disabled={disabled}
      className={`w-full py-16 rounded-xl border transition-all flex flex-col items-center gap-3 ${
        disabled
          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-40 cursor-not-allowed'
          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 active:bg-slate-200 dark:active:bg-slate-600'
      }`}
      aria-label="실습 완료 체크"
    >
      <div className="w-20 h-20 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
        <Check size={40} className="text-white dark:text-slate-900" strokeWidth={3} />
      </div>
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">완료했어요</span>
      <span className="text-sm text-slate-400 dark:text-slate-500">탭하여 완료를 알려주세요</span>
    </motion.button>
  );
});
