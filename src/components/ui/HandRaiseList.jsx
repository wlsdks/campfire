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
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-yellow-400 font-semibold text-sm">✋ 손들기 ({count})</span>
        <button onClick={dismissAll} className="text-xs text-white/40 hover:text-white">전체 해제</button>
      </div>
      <AnimatePresence>
        {raisedList.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-white">
              <span className="text-white/40 mr-2">{i + 1}.</span>
              {p.nickname}
            </span>
            <button onClick={() => dismissOne(p.id)} className="text-white/30 hover:text-white text-xs">해제</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
