import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getParticipantId } from '../../lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

const COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];

export default function ChoiceVoter({ sessionId, questionId, options }) {
  const [voted, setVoted] = useState(false);

  async function handleVote(option) {
    const pid = getParticipantId();
    await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
      value: option,
      timestamp: serverTimestamp(),
    });
    setVoted(true);
  }

  if (voted) return <VoteConfirm />;

  return (
    <div className="space-y-3 w-full">
      {options.map((option, i) => (
        <motion.button
          key={option}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleVote(option)}
          className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg ${COLORS[i]} active:brightness-75 transition-all`}
        >
          {option}
        </motion.button>
      ))}
    </div>
  );
}
