import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

const OPTION_STYLES = [
  { bg: 'bg-indigo-50 hover:bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-600', letter: 'A' },
  { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600', letter: 'B' },
  { bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-600', letter: 'C' },
  { bg: 'bg-violet-50 hover:bg-violet-100', text: 'text-violet-700', badge: 'bg-violet-600', letter: 'D' },
  { bg: 'bg-pink-50 hover:bg-pink-100', text: 'text-pink-700', badge: 'bg-pink-600', letter: 'E' },
];

export default function ChoiceVoter({ sessionId, questionId, options }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleVote(option) {
    setSelected(option);
    try {
      const pid = getParticipantId();
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value: option,
        timestamp: serverTimestamp(),
      });
      setVoted(true);
    } catch (err) {
      console.error('Vote failed:', err);
      setSelected(null);
    }
  }

  if (voted) return <VoteConfirm />;

  return (
    <div className="space-y-2.5 w-full">
      {options.map((option, i) => {
        const style = OPTION_STYLES[i % OPTION_STYLES.length];
        const isSelected = selected === option;
        return (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleVote(option)}
            disabled={selected !== null}
            className={`w-full py-3.5 px-4 rounded-xl border font-medium text-base ${style.bg} ${style.text} ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-transparent'} ${selected !== null && !isSelected ? 'opacity-40 cursor-not-allowed' : ''} transition-all flex items-center gap-3`}
          >
            <span className={`w-8 h-8 rounded-lg ${style.badge} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
              {style.letter}
            </span>
            <span className="text-left leading-snug">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
