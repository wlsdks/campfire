import { useEffect, useState } from 'react';
import { ref, onChildAdded } from 'firebase/database';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function JoinToast({ sessionId }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    const participantsRef = ref(db, `sessions/${sessionId}/participants`);
    let initial = true;

    const unsub = onChildAdded(participantsRef, (snapshot) => {
      if (initial) return;
      const data = snapshot.val();
      const id = Date.now();
      setToasts(prev => [...prev, { id, nickname: data.nickname }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });

    setTimeout(() => { initial = false; }, 2000);

    return () => unsub();
  }, [sessionId]);

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-white shadow-lg border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {toast.nickname}님 입장!
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
