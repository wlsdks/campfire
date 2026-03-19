import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';
import StudentLiveResults from './StudentLiveResults';

export default function OXVoter({ sessionId, questionId, disabled = false }) {
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
      console.error('Vote failed:', err);
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
    <div className="flex gap-3 w-full" role="group" aria-label="O/X 선택">
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleVote('O')}
        disabled={selected !== null || disabled}
        className={`flex-1 py-10 rounded-xl bg-slate-50 hover:bg-slate-100 border transition-all flex flex-col items-center gap-1.5 ${selected === 'O' ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'} ${(selected !== null && selected !== 'O') || disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-5xl font-black text-slate-900">O</span>
        <span className="text-sm font-medium text-slate-400">맞아요</span>
      </motion.button>
      <motion.button
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleVote('X')}
        disabled={selected !== null || disabled}
        className={`flex-1 py-10 rounded-xl bg-slate-50 hover:bg-slate-100 border transition-all flex flex-col items-center gap-1.5 ${selected === 'X' ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'} ${(selected !== null && selected !== 'X') || disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="text-5xl font-black text-slate-900">X</span>
        <span className="text-sm font-medium text-slate-400">아니에요</span>
      </motion.button>
    </div>
  );
}
