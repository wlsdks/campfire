import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { formatPercent } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

const COLORS = [
  { bar: 'bg-indigo-500', text: 'text-slate-700', track: 'bg-slate-100' },
  { bar: 'bg-indigo-400', text: 'text-slate-600', track: 'bg-slate-100' },
  { bar: 'bg-indigo-300', text: 'text-slate-500', track: 'bg-slate-100' },
  { bar: 'bg-indigo-300', text: 'text-slate-500', track: 'bg-slate-100' },
  { bar: 'bg-indigo-200', text: 'text-slate-400', track: 'bg-slate-100' },
];

export default function BarChart({ sessionId, questionId, options, correctValue = null, revealed = false }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto">
      {options.map((option, i) => {
        const count = countByValue(option);
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const style = COLORS[i % COLORS.length];
        const isCorrect = revealed && correctValue === option;
        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
            className="space-y-1.5"
          >
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 text-base">{option}</span>
                {isCorrect && <Badge variant="primary">정답</Badge>}
              </div>
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
                className={`h-full rounded-xl ${isCorrect ? 'bg-indigo-600' : style.bar}`}
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
