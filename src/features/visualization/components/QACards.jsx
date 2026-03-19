import { useVotes } from '@/hooks/useVotes';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function QACards({ sessionId, questionId }) {
  const { voteList } = useVotes(sessionId, questionId);
  const sorted = [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">응답 목록</h3>
        <span className="text-xs text-slate-400">{sorted.length}개 응답</span>
      </div>

      <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
        <AnimatePresence>
          {sorted.map((vote, i) => (
            <motion.div
              key={vote.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2, ease: 'easeOut' }}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm leading-relaxed">{vote.value}</p>
              </div>
              <div className="shrink-0 text-right">
                {vote.nickname && (
                  <p className="text-xs font-medium text-slate-500">{vote.nickname}</p>
                )}
                <p className="text-xs text-slate-300">{formatTime(vote.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <MessageSquare size={28} className="text-slate-200 mx-auto" />
            <p className="text-slate-400 text-sm">아직 응답이 없습니다</p>
            <p className="text-slate-300 text-xs">학생들이 답변하면 여기에 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
