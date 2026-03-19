import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VoteConfirm from './VoteConfirm';

const OPTION_STYLES = [
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-800', letter: 'A' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-700', letter: 'B' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-600', letter: 'C' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-500', letter: 'D' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-500', letter: 'E' },
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
        const hasSelection = selected !== null;
        return (
          <motion.button
            key={option}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: hasSelection && !isSelected ? 0.4 : 1,
              y: hasSelection && !isSelected ? 2 : 0,
              scale: isSelected ? [0.97, 1.02, 1] : 1,
            }}
            transition={isSelected
              ? { scale: { type: 'spring', stiffness: 400, damping: 15 }, opacity: { duration: 0.2 } }
              : { delay: hasSelection ? 0 : i * 0.05, duration: 0.25, ease: 'easeOut' }
            }
            whileTap={!hasSelection ? { scale: 0.97 } : undefined}
            onClick={() => handleVote(option)}
            disabled={hasSelection}
            className={`w-full py-3.5 px-4 rounded-xl border font-medium text-base ${style.bg} ${style.text} ${isSelected ? 'ring-2 ring-slate-400 border-slate-300 bg-slate-50' : 'border-slate-200'} ${hasSelection && !isSelected ? 'cursor-not-allowed' : ''} transition-colors flex items-center gap-3`}
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
