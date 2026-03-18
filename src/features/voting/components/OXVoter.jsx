import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

export default function OXVoter({ sessionId, questionId }) {
  const [voted, setVoted] = useState(false);

  async function handleVote(value) {
    const pid = getParticipantId();
    await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
      value,
      timestamp: serverTimestamp(),
    });
    setVoted(true);
  }

  if (voted) return <VoteConfirm />;

  return (
    <div className="flex gap-4 w-full">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => handleVote('O')}
        className="flex-1 py-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-6xl font-black active:brightness-90 shadow-sm transition-all flex flex-col items-center gap-2"
      >
        <span>O</span>
        <span className="text-sm font-medium text-white/70">맞아요</span>
      </motion.button>
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => handleVote('X')}
        className="flex-1 py-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-6xl font-black active:brightness-90 shadow-sm transition-all flex flex-col items-center gap-2"
      >
        <span>X</span>
        <span className="text-sm font-medium text-white/70">아니에요</span>
      </motion.button>
    </div>
  );
}
