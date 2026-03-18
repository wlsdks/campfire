import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';

const COLORS = [
  { bar: 'bg-blue-500', text: 'text-blue-600' },
  { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { bar: 'bg-amber-500', text: 'text-amber-600' },
  { bar: 'bg-violet-500', text: 'text-violet-600' },
  { bar: 'bg-rose-500', text: 'text-rose-600' },
];

export default function BarChart({ sessionId, questionId, options }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  return (
    <div className="space-y-5 w-full max-w-2xl mx-auto">
      {options.map((option, i) => {
        const count = countByValue(option);
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const style = COLORS[i % COLORS.length];
        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-gray-700 text-lg">{option}</span>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={count}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className={`font-bold text-xl ${style.text}`}
                >
                  {count}
                </motion.span>
                <span className="text-gray-400 text-sm">({formatPercent(count, totalVotes)})</span>
              </div>
            </div>
            <div className="h-12 bg-gray-100 rounded-2xl overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                className={`h-full rounded-2xl ${style.bar} min-w-[4px]`}
              />
            </div>
          </motion.div>
        );
      })}
      <div className="text-center text-gray-400 text-sm mt-6 pt-4 border-t border-gray-100">
        총 <span className="text-gray-600 font-semibold">{totalVotes}</span>명 투표
      </div>
    </div>
  );
}
