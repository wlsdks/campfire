import { useVotes } from '@/hooks/useVotes';
import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PickMascot from '@/components/ui/PickMascot';
// Monochromatic slate palette — Tailwind classes for dark mode support
const WORD_CLASSES = [
  'text-slate-900 dark:text-slate-100',
  'text-slate-800 dark:text-slate-200',
  'text-slate-700 dark:text-slate-300',
  'text-slate-600 dark:text-slate-400',
  'text-slate-500 dark:text-slate-400',
  'text-slate-400 dark:text-slate-500',
  'text-slate-700 dark:text-slate-300',
  'text-slate-600 dark:text-slate-400',
];

export default memo(function WordCloud({ sessionId, questionId }) {
  const { tally, totalVotes } = useVotes(sessionId, questionId);
  const tallied = tally();

  const words = useMemo(() => {
    return Object.entries(tallied)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count);
  }, [tallied]);

  const maxCount = Math.max(...words.map(w => w.count), 1);

  function getFontSize(count) {
    const min = 24, max = 68;
    return min + ((count / maxCount) * (max - min));
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        layout
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 p-6 min-h-[300px]"
      >
        <AnimatePresence>
          {words.map((word, i) => (
            <motion.span
              layout
              key={word.text}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.008 }}
              style={{ fontSize: getFontSize(word.count) }}
              className={`font-bold cursor-default max-w-full truncate ${WORD_CLASSES[i % WORD_CLASSES.length]}`}
              title={`${word.text}: ${word.count}회`}
            >
              {word.text}
            </motion.span>
          ))}
        </AnimatePresence>
        {words.length === 0 && (
          <div className="text-center space-y-2 flex flex-col items-center">
            <PickMascot size="sm" />
            <p className="text-slate-400 dark:text-slate-500 text-base">아직 입력이 없습니다</p>
          </div>
        )}
      </motion.div>
      {totalVotes > 0 && (
        <div className="text-center text-slate-400 dark:text-slate-500 text-sm mt-2">
          총 {totalVotes}개 응답
        </div>
      )}
    </div>
  );
});
