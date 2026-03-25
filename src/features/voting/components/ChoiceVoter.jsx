import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState, memo } from 'react';
import { hapticTap } from '@/lib/haptics';
import VoteConfirm from './VoteConfirm';
import StudentLiveResults from './StudentLiveResults';

const OPTION_STYLES = [
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-800 dark:bg-slate-200 dark:text-slate-900', letter: 'A' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-700 dark:bg-slate-300 dark:text-slate-900', letter: 'B' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-600 dark:bg-slate-400 dark:text-slate-900', letter: 'C' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-500 dark:bg-slate-500', letter: 'D' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-500 dark:bg-slate-500', letter: 'E' },
];

export default memo(function ChoiceVoter({ sessionId, questionId, options, disabled = false }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleVote(option) {
    if (disabled) return;
    setSelected(option);
    try {
      const pid = getParticipantId();
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value: option,
        timestamp: serverTimestamp(),
      });
      setVoted(true);
    } catch (err) {
      logger.error('Vote failed:', err);
      setSelected(null);
    }
  }

  if (voted) {
    const idx = options.indexOf(selected);
    const letter = idx >= 0 ? OPTION_STYLES[idx % OPTION_STYLES.length].letter : '';
    return (
      <div className="space-y-3">
        <VoteConfirm selectedAnswer={letter ? `${letter}. ${selected}` : selected} />
        <StudentLiveResults
          sessionId={sessionId}
          questionId={questionId}
          options={options}
          myAnswer={selected}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full" role="group" aria-label="선택지">
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
              scale: isSelected ? [0.95, 1.04, 1] : 1,
            }}
            transition={isSelected
              ? { scale: { type: 'spring', stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }
              : { delay: hasSelection ? 0 : i * 0.05, type: 'spring', stiffness: 300, damping: 25, opacity: { duration: 0.15 } }
            }
            whileTap={!hasSelection ? { scale: 0.95 } : undefined}
            onClick={() => { hapticTap(); handleVote(option); }}
            disabled={hasSelection || disabled}
            className={`w-full min-h-[56px] py-4 px-5 rounded-xl border font-medium text-base ${style.bg} ${style.text} ${isSelected ? 'ring-2 ring-slate-400 dark:ring-slate-500 border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-700'} ${hasSelection && !isSelected ? 'cursor-not-allowed' : ''} transition-colors duration-150 flex items-center gap-3.5`}
          >
            <span className={`w-9 h-9 rounded-lg ${style.badge} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
              {style.letter}
            </span>
            <span className="text-left leading-snug">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
})
