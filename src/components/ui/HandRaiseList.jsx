import { ref, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useHandRaises } from '../../hooks/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';

export default function HandRaiseList({ sessionId }) {
  const { raisedList, count } = useHandRaises(sessionId);

  async function dismissOne(participantId) {
    await set(ref(db, `sessions/${sessionId}/handRaises/${participantId}/raised`), false);
  }

  async function dismissAll() {
    const updates = {};
    raisedList.forEach(p => {
      updates[`sessions/${sessionId}/handRaises/${p.id}/raised`] = false;
    });
    const { update } = await import('firebase/database');
    await update(ref(db), updates);
  }

  if (count === 0) return null;

  return (
    <div className="glass rounded-2xl p-3.5 space-y-2.5 border-amber-500/20">
      <div className="flex items-center justify-between">
        <span className="text-amber-400 font-semibold text-sm flex items-center gap-1.5">
          ✋ 손들기
          <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
        </span>
        <button onClick={dismissAll} className="text-xs text-white/30 hover:text-white/60 transition-colors">전체 해제</button>
      </div>
      <AnimatePresence>
        {raisedList.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between text-sm py-1"
          >
            <span className="text-white">
              <span className="text-white/25 mr-2 text-xs">{i + 1}.</span>
              {p.nickname}
            </span>
            <button onClick={() => dismissOne(p.id)} className="text-white/20 hover:text-white/50 text-xs transition-colors">해제</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
