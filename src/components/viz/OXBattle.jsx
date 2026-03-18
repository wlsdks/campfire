import { motion } from 'framer-motion';
import { useVotes } from '../../hooks/useVotes';

export default function OXBattle({ sessionId, questionId }) {
  const { totalVotes, countByValue } = useVotes(sessionId, questionId);
  const oCount = countByValue('O');
  const xCount = countByValue('X');
  const oPct = totalVotes > 0 ? (oCount / totalVotes) * 100 : 50;
  const xPct = totalVotes > 0 ? (xCount / totalVotes) * 100 : 50;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-end justify-between text-center">
        <div className="flex-1">
          <motion.div key={oCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-6xl font-bold text-blue-400">O</motion.div>
          <div className="text-3xl font-bold text-white mt-2">{oCount}명</div>
        </div>
        <div className="text-white/30 text-2xl">VS</div>
        <div className="flex-1">
          <motion.div key={xCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-6xl font-bold text-rose-400">X</motion.div>
          <div className="text-3xl font-bold text-white mt-2">{xCount}명</div>
        </div>
      </div>
      <div className="h-8 bg-gray-800 rounded-full overflow-hidden flex">
        <motion.div animate={{ width: `${oPct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} className="bg-blue-500 h-full" />
        <motion.div animate={{ width: `${xPct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} className="bg-rose-500 h-full" />
      </div>
      <div className="flex justify-between text-white/60 text-lg">
        <span>{Math.round(oPct)}%</span>
        <span>{Math.round(xPct)}%</span>
      </div>
    </div>
  );
}
