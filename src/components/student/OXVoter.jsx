import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getParticipantId } from '../../lib/participant';
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
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote('O')}
        className="flex-1 py-8 rounded-2xl bg-blue-600 text-white text-5xl font-bold active:brightness-75"
      >
        O
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote('X')}
        className="flex-1 py-8 rounded-2xl bg-rose-600 text-white text-5xl font-bold active:brightness-75"
      >
        X
      </motion.button>
    </div>
  );
}
