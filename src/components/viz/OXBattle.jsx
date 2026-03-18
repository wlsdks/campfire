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
            className="text-8xl font-black bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
          >
            O
          </motion.div>
          <motion.div
            key={`o-${oCount}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-white"
          >
            {oCount}
          </motion.div>
          <div className="text-white/30 text-sm">명</div>
        </div>

        <div className="px-6">
          <div className="text-white/15 text-3xl font-bold">VS</div>
        </div>

        <div className="flex-1 space-y-3">
          <motion.div
            key={xCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-8xl font-black bg-gradient-to-br from-rose-400 to-rose-600 bg-clip-text text-transparent"
          >
            X
          </motion.div>
          <motion.div
            key={`x-${xCount}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-white"
          >
            {xCount}
          </motion.div>
          <div className="text-white/30 text-sm">명</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-10 bg-white/5 rounded-full overflow-hidden flex">
          <motion.div
            animate={{ width: `${oPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-l-full"
          />
          <motion.div
            animate={{ width: `${xPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span className="text-blue-400">{Math.round(oPct)}%</span>
          <span className="text-white/20 text-sm">총 {totalVotes}명</span>
          <span className="text-rose-400">{Math.round(xPct)}%</span>
        </div>
      </div>
    </div>
  );
}
