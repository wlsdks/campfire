import { useState } from 'react';
import { useVotes } from '@/hooks/useVotes';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{item.nickname || '익명'}</p>
            <p className="text-xs text-slate-300 mt-0.5">{formatTime(item.timestamp)}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-lg text-slate-800 leading-relaxed">{item.value}</p>
      </motion.div>
    </motion.div>
  );
}

export default function QACards({ sessionId, questionId }) {
  const { voteList } = useVotes(sessionId, questionId);
  const [selected, setSelected] = useState(null);
  const sorted = [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-3">
        {sorted.map((vote, i) => (
          <motion.button
            key={vote.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2, ease: 'easeOut' }}
            onClick={() => setSelected(vote)}
            className="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-slate-800 text-base leading-relaxed line-clamp-2 flex-1">{vote.value}</p>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-400">{vote.nickname || '익명'}</p>
                <p className="text-xs text-slate-300">{formatTime(vote.timestamp)}</p>
              </div>
            </div>
          </motion.button>
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <MessageSquare size={28} className="text-slate-200 mx-auto" />
            <p className="text-slate-400 text-sm">아직 응답이 없습니다</p>
            <p className="text-slate-300 text-xs">학생들이 답변하면 여기에 표시됩니다</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
