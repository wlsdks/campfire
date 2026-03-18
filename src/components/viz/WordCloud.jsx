import { useVotes } from '../../hooks/useVotes';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WordCloud({ sessionId, questionId }) {
  const { tally, totalVotes } = useVotes(sessionId, questionId);
  const tallied = tally();

  const words = useMemo(() => {
    return Object.entries(tallied)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count);
  }, [tallied]);

  const maxCount = Math.max(...words.map(w => w.count), 1);

  function getFontSize(count) {
    const min = 16, max = 72;
    return min + ((count / maxCount) * (max - min));
  }

  const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#38bdf8', '#f472b6'];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-8 min-h-[300px]">
      <AnimatePresence>
        {words.map((word, i) => (
          <motion.span
            key={word.text}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ fontSize: getFontSize(word.count), color: COLORS[i % COLORS.length] }}
            className="font-bold whitespace-nowrap"
          >
            {word.text}
          </motion.span>
        ))}
      </AnimatePresence>
      {words.length === 0 && <p className="text-white/30 text-lg">아직 입력이 없습니다...</p>}
    </div>
  );
}
