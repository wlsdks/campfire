import { useVotes } from '../../hooks/useVotes';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
  '#f472b6', '#fb7185', '#fbbf24', '#34d399',
  '#38bdf8', '#60a5fa', '#6ee7b7', '#fcd34d',
];

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
    const min = 18, max = 80;
    return min + ((count / maxCount) * (max - min));
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 p-8 min-h-[320px]">
        <AnimatePresence>
          {words.map((word, i) => (
            <motion.span
              key={word.text}
              initial={{ opacity: 0, scale: 0, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.03 }}
              style={{
                fontSize: getFontSize(word.count),
                color: COLORS[i % COLORS.length],
              }}
              className="font-extrabold whitespace-nowrap transition-transform hover:scale-110 cursor-default"
              title={`${word.text}: ${word.count}회`}
            >
              {word.text}
            </motion.span>
          ))}
        </AnimatePresence>
        {words.length === 0 && (
          <div className="text-center space-y-3">
            <div className="text-4xl opacity-30">💬</div>
            <p className="text-white/20 text-lg">아직 입력이 없습니다...</p>
          </div>
        )}
      </div>
      {totalVotes > 0 && (
        <div className="text-center text-white/20 text-sm mt-2">
          총 {totalVotes}개 응답
        </div>
      )}
    </div>
  );
}
