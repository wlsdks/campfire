import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';

export default function OXBattle({ sessionId, questionId }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);
  const oCount = countByValue('O');
  const xCount = countByValue('X');
  const oPct = totalVotes > 0 ? (oCount / totalVotes) * 100 : 50;
  const xPct = totalVotes > 0 ? (xCount / totalVotes) * 100 : 50;
  const oWinning = oCount > xCount;
  const xWinning = xCount > oCount;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Split display */}
      <div className="flex items-center justify-between text-center">
        <div className="flex-1 space-y-2">
          <motion.div
            key={oCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-7xl font-black ${oWinning ? 'text-indigo-600' : 'text-indigo-400'}`}
          >
            O
          </motion.div>
          <motion.div
            key={`o-${oCount}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-slate-900"
          >
            {oCount}
          </motion.div>
          <div className="text-slate-400 text-sm">명</div>
        </div>

        <div className="px-4">
          <div className="text-slate-200 text-2xl font-bold">VS</div>
        </div>

        <div className="flex-1 space-y-2">
          <motion.div
            key={xCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-7xl font-black ${xWinning ? 'text-slate-700' : 'text-slate-400'}`}
          >
            X
          </motion.div>
          <motion.div
            key={`x-${xCount}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-slate-900"
          >
            {xCount}
          </motion.div>
          <div className="text-slate-400 text-sm">명</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2.5">
        <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
          <motion.div
            animate={{ width: `${oPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 22 }}
            className="bg-indigo-500 h-full rounded-l-full"
          />
          <motion.div
            animate={{ width: `${xPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 22 }}
            className="bg-slate-400 h-full rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-indigo-600">{Math.round(oPct)}%</span>
          <span className="text-slate-300 text-sm">총 {totalVotes}명</span>
          <span className="text-slate-600">{Math.round(xPct)}%</span>
        </div>
      </div>
    </div>
  );
}
