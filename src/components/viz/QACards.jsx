import { useVotes } from '../../hooks/useVotes';
import { motion, AnimatePresence } from 'framer-motion';

export default function QACards({ sessionId, questionId }) {
  const { voteList } = useVotes(sessionId, questionId);
  const sorted = [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto max-h-[70vh] overflow-y-auto">
      <AnimatePresence>
        {sorted.map((vote, i) => (
          <motion.div
            key={vote.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-800 rounded-xl p-4"
          >
            <p className="text-white text-lg">{vote.value}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {sorted.length === 0 && <p className="text-white/30 text-lg text-center">아직 질문이 없습니다...</p>}
    </div>
  );
}
