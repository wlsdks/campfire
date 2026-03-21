import { memo } from 'react';
import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';
import { Check } from 'lucide-react';

export default memo(function OXBattle({ sessionId, questionId, correctValue = null, revealed = false }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);
  const oCount = countByValue('O');
  const xCount = countByValue('X');
  const oPct = totalVotes > 0 ? (oCount / totalVotes) * 100 : 50;
  const xPct = totalVotes > 0 ? (xCount / totalVotes) * 100 : 50;
  const oWinning = oCount > xCount;
  const xWinning = xCount > oCount;
  const oCorrect = revealed && correctValue === 'O';
  const xCorrect = revealed && correctValue === 'X';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Split display */}
      <div className="flex items-center justify-between text-center">
        <div className={`flex-1 space-y-2 py-4 rounded-xl transition-all ${oCorrect ? 'ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
          <div className="relative inline-block">
            <motion.div
              key={oCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`text-7xl font-black ${
                revealed
                  ? oCorrect ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'
                  : oWinning ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-400 dark:text-indigo-500'
              }`}
            >
              O
            </motion.div>
            {oCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-3 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              >
                <Check size={14} strokeWidth={3} />
              </motion.span>
            )}
          </div>
          <motion.div
            key={`o-${oCount}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold ${oCorrect ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}
          >
            {oCount}
          </motion.div>
          <div className="text-slate-400 dark:text-slate-500 text-sm">명</div>
        </div>

        <div className="px-4">
          <div className="text-slate-200 dark:text-slate-700 text-2xl font-bold">VS</div>
        </div>

        <div className={`flex-1 space-y-2 py-4 rounded-xl transition-all ${xCorrect ? 'bg-slate-100/80 dark:bg-slate-700/50 ring-2 ring-slate-400/30 dark:ring-slate-500/30' : ''}`}>
          <div className="relative inline-block">
            <motion.div
              key={xCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`text-7xl font-black ${
                revealed
                  ? xCorrect ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                  : xWinning ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              X
            </motion.div>
            {xCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-3 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900"
              >
                <Check size={14} strokeWidth={3} />
              </motion.span>
            )}
          </div>
          <motion.div
            key={`x-${xCount}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold ${xCorrect ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-slate-100'}`}
          >
            {xCount}
          </motion.div>
          <div className="text-slate-400 dark:text-slate-500 text-sm">명</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2.5">
        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
          <motion.div
            animate={{ width: `${oPct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            className="bg-indigo-500 h-full rounded-l-full"
          />
          <motion.div
            animate={{ width: `${xPct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            className="bg-slate-400 h-full rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-indigo-600 dark:text-indigo-400">{Math.round(oPct)}%</span>
          <span className="text-slate-400 dark:text-slate-500 text-sm">총 {totalVotes}명</span>
          <span className="text-slate-600 dark:text-slate-300">{Math.round(xPct)}%</span>
        </div>
      </div>
    </div>
  );
});
