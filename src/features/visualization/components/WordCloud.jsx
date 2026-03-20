import { useVotes } from '@/hooks/useVotes';
import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from 'lucide-react';
// Monochromatic slate palette for word cloud
const COLORS = [
  '#0F172A', '#1E293B', '#334155', '#475569',
  '#64748B', '#94A3B8', '#334155', '#475569',
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
    const min = 18, max = 72;
    return min + ((count / maxCount) * (max - min));
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 p-6 min-h-[300px]">
        <AnimatePresence>
          {words.map((word, i) => (
            <motion.span
              key={word.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.03 }}
              style={{
                fontSize: getFontSize(word.count),
                color: COLORS[i % COLORS.length],
              }}
              className="font-bold whitespace-nowrap transition-transform hover:scale-105 cursor-default"
              title={`${word.text}: ${word.count}회`}
            >
              {word.text}
            </motion.span>
          ))}
        </AnimatePresence>
        {words.length === 0 && (
          <div className="text-center space-y-2">
            <Cloud size={28} className="text-slate-400 mx-auto" />
            <p className="text-slate-400 text-base">아직 입력이 없습니다</p>
          </div>
        )}
      </div>
      {totalVotes > 0 && (
        <div className="text-center text-slate-400 text-sm mt-2">
          총 {totalVotes}개 응답
        </div>
      )}
    </div>
  );
});
