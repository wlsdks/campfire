import { motion } from 'framer-motion';
import { useVotes } from '../../hooks/useVotes';
import { formatPercent } from '../../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

export default function BarChart({ sessionId, questionId, options }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {options.map((option, i) => {
        const count = countByValue(option);
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        return (
          <div key={option} className="space-y-1">
            <div className="flex justify-between text-white">
              <span className="font-medium">{option}</span>
              <span className="text-white/60">{count}표 ({formatPercent(count, totalVotes)})</span>
            </div>
            <div className="h-10 bg-gray-800 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="h-full rounded-lg"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
      <div className="text-center text-white/40 text-sm mt-4">총 {totalVotes}명 투표</div>
    </div>
  );
}
