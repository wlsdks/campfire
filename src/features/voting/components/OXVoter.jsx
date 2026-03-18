import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

export default function OXVoter({ sessionId, questionId }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleVote(value) {
    setSelected(value);
    const pid = getParticipantId();
    await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
      value,
      timestamp: serverTimestamp(),
    });
    setVoted(true);
  }

  if (voted) return <VoteConfirm />;

  return (
    <div className="flex gap-3 w-full">
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleVote('O')}
        disabled={selected !== null}
        className={`flex-1 py-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 border transition-all flex flex-col items-center gap-1.5 ${selected === 'O' ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-transparent'}`}
      >
        <span className="text-5xl font-black text-indigo-600">O</span>
        <span className="text-sm font-medium text-indigo-400">맞아요</span>
      </motion.button>
      <motion.button
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleVote('X')}
        disabled={selected !== null}
        className={`flex-1 py-10 rounded-xl bg-slate-100 hover:bg-slate-200 border transition-all flex flex-col items-center gap-1.5 ${selected === 'X' ? 'ring-2 ring-slate-500 border-slate-400' : 'border-transparent'}`}
      >
        <span className="text-5xl font-black text-slate-600">X</span>
        <span className="text-sm font-medium text-slate-400">아니에요</span>
      </motion.button>
    </div>
  );
}
