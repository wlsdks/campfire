import { ref, set, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';

export default function HandRaiseList({ sessionId }) {
  const { raisedList, count } = useHandRaises(sessionId);

  async function dismissOne(participantId) {
    try {
      await set(ref(db, `sessions/${sessionId}/handRaises/${participantId}/raised`), false);
    } catch (err) {
      console.error('손들기 해제 실패:', err);
    }
  }

  async function dismissAll() {
    try {
      const updates = {};
      raisedList.forEach(p => {
        updates[`sessions/${sessionId}/handRaises/${p.id}/raised`] = false;
      });
      await update(ref(db), updates);
    } catch (err) {
      console.error('전체 손들기 해제 실패:', err);
    }
  }

  if (count === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
          <Hand size={14} className="text-slate-400" />
          손들기
          <Badge variant="neutral">{count}</Badge>
        </span>
        <button onClick={dismissAll} aria-label="모든 손들기 해제" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">전체 해제</button>
      </div>
      <AnimatePresence>
        {raisedList.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex items-center justify-between text-sm py-1"
          >
            <span className="text-slate-700">
              <span className="text-slate-400 mr-2 text-xs">{i + 1}.</span>
              {p.nickname}
            </span>
            <IconButton icon={X} size="sm" variant="danger" label="해제" onClick={() => dismissOne(p.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
