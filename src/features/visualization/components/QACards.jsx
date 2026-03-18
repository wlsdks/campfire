import { useVotes } from '@/hooks/useVotes';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export default function QACards({ sessionId, questionId }) {
  const { voteList } = useVotes(sessionId, questionId);
  const sorted = [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div className="space-y-2.5 w-full max-w-2xl mx-auto max-h-[70vh] overflow-y-auto pr-2">
      <AnimatePresence>
        {sorted.map((vote, i) => (
          <motion.div
            key={vote.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-slate-700 text-base leading-relaxed">{vote.value}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {sorted.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
            <MessageSquare size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-300 text-base">아직 응답이 없습니다</p>
        </div>
      )}
    </div>
  );
}
