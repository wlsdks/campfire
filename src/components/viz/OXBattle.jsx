import { motion } from 'framer-motion';
import { useVotes } from '../../hooks/useVotes';

export default function OXBattle({ sessionId, questionId }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);
  const oCount = countByValue('O');
  const xCount = countByValue('X');
  const oPct = totalVotes > 0 ? (oCount / totalVotes) * 100 : 50;
  const xPct = totalVotes > 0 ? (xCount / totalVotes) * 100 : 50;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between text-center">
        <div className="flex-1 space-y-3">
          <motion.div
            key={oCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-8xl font-black text-blue-500"
          >
            O
          </motion.div>
          <motion.div
            key={`o-${oCount}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-gray-900"
          >
            {oCount}
          </motion.div>
          <div className="text-gray-400 text-sm">명</div>
        </div>

        <div className="px-6">
          <div className="text-gray-200 text-3xl font-bold">VS</div>
        </div>

        <div className="flex-1 space-y-3">
          <motion.div
            key={xCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-8xl font-black text-rose-500"
          >
            X
          </motion.div>
          <motion.div
            key={`x-${xCount}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-gray-900"
          >
            {xCount}
          </motion.div>
          <div className="text-gray-400 text-sm">명</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded-full overflow-hidden flex">
          <motion.div
            animate={{ width: `${oPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            className="bg-blue-500 h-full rounded-l-full"
          />
          <motion.div
            animate={{ width: `${xPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            className="bg-rose-500 h-full rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span className="text-blue-500">{Math.round(oPct)}%</span>
          <span className="text-gray-300 text-sm">총 {totalVotes}명</span>
          <span className="text-rose-500">{Math.round(xPct)}%</span>
        </div>
      </div>
    </div>
  );
}
