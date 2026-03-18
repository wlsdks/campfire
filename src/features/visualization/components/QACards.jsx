import { useVotes } from '@/hooks/useVotes';
import { motion, AnimatePresence } from 'framer-motion';

export default function QACards({ sessionId, questionId }) {
  const { voteList } = useVotes(sessionId, questionId);
  const sorted = [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto max-h-[70vh] overflow-y-auto pr-2">
      <AnimatePresence>
        {sorted.map((vote, i) => (
          <motion.div
            key={vote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-gray-700 text-lg leading-relaxed">{vote.value}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {sorted.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl opacity-30">💡</div>
          <p className="text-gray-300 text-lg">아직 질문이 없습니다...</p>
        </div>
      )}
    </div>
  );
}
