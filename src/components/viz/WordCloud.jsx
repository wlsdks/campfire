import { useVotes } from '../../hooks/useVotes';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#F43F5E', '#06B6D4', '#EC4899', '#84CC16',
  '#6366F1', '#14B8A6', '#F97316', '#0EA5E9',
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
            <p className="text-gray-300 text-lg">아직 입력이 없습니다...</p>
          </div>
        )}
      </div>
      {totalVotes > 0 && (
        <div className="text-center text-gray-400 text-sm mt-2">
          총 {totalVotes}개 응답
        </div>
      )}
    </div>
  );
}
