import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

const OPTION_STYLES = [
  { bg: 'bg-blue-500 hover:bg-blue-600', letter: 'A' },
  { bg: 'bg-emerald-500 hover:bg-emerald-600', letter: 'B' },
  { bg: 'bg-amber-500 hover:bg-amber-600', letter: 'C' },
  { bg: 'bg-violet-500 hover:bg-violet-600', letter: 'D' },
  { bg: 'bg-rose-500 hover:bg-rose-600', letter: 'E' },
];

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
      {options.map((option, i) => {
        const style = OPTION_STYLES[i % OPTION_STYLES.length];
        return (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleVote(option)}
            className={`w-full py-4 px-5 rounded-2xl text-white font-semibold text-lg ${style.bg} shadow-sm active:brightness-90 transition-all flex items-center gap-4`}
          >
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-base font-bold shrink-0">
              {style.letter}
            </span>
            <span className="text-left">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
