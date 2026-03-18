import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';

const COLORS = [
  { bar: 'bg-indigo-500', text: 'text-indigo-600', track: 'bg-indigo-50' },
  { bar: 'bg-emerald-500', text: 'text-emerald-600', track: 'bg-emerald-50' },
  { bar: 'bg-amber-500', text: 'text-amber-600', track: 'bg-amber-50' },
  { bar: 'bg-violet-500', text: 'text-violet-600', track: 'bg-violet-50' },
  { bar: 'bg-pink-500', text: 'text-pink-600', track: 'bg-pink-50' },
];

export default function BarChart({ sessionId, questionId, options }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {options.map((option, i) => {
        const count = countByValue(option);
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const style = COLORS[i % COLORS.length];
        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
            className="space-y-1.5"
          >
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-slate-700 text-base">{option}</span>
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  key={count}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`font-bold text-lg ${style.text}`}
                >
                  {count}
                </motion.span>
                <span className="text-slate-400 text-sm">{formatPercent(count, totalVotes)}</span>
              </div>
            </div>
            <div className={`h-10 ${style.track} rounded-xl overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 22, delay: i * 0.08 }}
                className={`h-full rounded-xl ${style.bar}`}
              />
            </div>
          </motion.div>
        );
      })}
      <div className="text-center text-slate-400 text-sm mt-4 pt-4 border-t border-slate-100">
        총 <span className="text-slate-600 font-semibold">{totalVotes}</span>명 투표
      </div>
    </div>
  );
}
