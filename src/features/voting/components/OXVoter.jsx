import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';
import { useState, memo } from 'react';
import VoteConfirm from './VoteConfirm';
import StudentLiveResults from './StudentLiveResults';

export default memo(function OXVoter({ sessionId, questionId, disabled = false }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleVote(value) {
    if (disabled) return;
    setSelected(value);
    try {
      const pid = getParticipantId();
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value,
        timestamp: serverTimestamp(),
      });
      setVoted(true);
    } catch (err) {
      logger.error('Vote failed:', err);
      setSelected(null);
    }
  }

  if (voted) {
    return (
      <div className="space-y-3">
        <VoteConfirm selectedAnswer={selected === 'O' ? 'O (맞아요)' : 'X (아니에요)'} />
        <StudentLiveResults
          sessionId={sessionId}
          questionId={questionId}
          options={['O', 'X']}
          myAnswer={selected}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 w-full" role="group" aria-label="O/X 선택">
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={!selected && !disabled ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.95 }}
        onClick={() => { hapticTap(); handleVote('O'); }}
        disabled={selected !== null || disabled}
        className={`flex-1 py-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border transition-all flex flex-col items-center gap-2 ${selected === 'O' ? 'ring-2 ring-slate-400 dark:ring-slate-500 border-slate-300 dark:border-slate-500' : 'border-slate-200 dark:border-slate-700'} ${(selected !== null && selected !== 'O') || disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-6xl font-black text-slate-900 dark:text-slate-100">O</span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">맞아요</span>
      </motion.button>
      <motion.button
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={!selected && !disabled ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.95 }}
        onClick={() => { hapticTap(); handleVote('X'); }}
        disabled={selected !== null || disabled}
        className={`flex-1 py-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border transition-all flex flex-col items-center gap-2 ${selected === 'X' ? 'ring-2 ring-slate-400 dark:ring-slate-500 border-slate-300 dark:border-slate-500' : 'border-slate-200 dark:border-slate-700'} ${(selected !== null && selected !== 'X') || disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-6xl font-black text-slate-900 dark:text-slate-100">X</span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">아니에요</span>
      </motion.button>
    </div>
  );
})
