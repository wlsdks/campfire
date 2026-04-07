import { useEffect, useState, useRef } from 'react';
import { ref, onChildAdded } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

const MAX_TOASTS = 3;
const TOAST_DURATION = 2000;
const THROTTLE_MS = 300;

export default function JoinToast({ sessionId }) {
  const [toasts, setToasts] = useState([]);
  const queueRef = useRef([]);
  const drainRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; if (drainRef.current) clearInterval(drainRef.current); };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const participantsRef = ref(db, `sessions/${sessionId}/participants`);
    let initial = true;

    const unsub = onChildAdded(participantsRef, (snapshot) => {
      if (initial) return;
      const data = snapshot.val();
      if (!data?.nickname) return;

      queueRef.current.push(data.nickname);
      // 큐 드레인 시작
      if (!drainRef.current) {
        drainRef.current = setInterval(() => {
          if (!mountedRef.current || queueRef.current.length === 0) {
            clearInterval(drainRef.current);
            drainRef.current = null;
            return;
          }
          const nickname = queueRef.current.shift();
          const id = Date.now() + Math.random();
          setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { id, nickname }]);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setToasts(prev => prev.filter(t => t.id !== id));
          }, TOAST_DURATION);
        }, THROTTLE_MS);
      }
    });

    setTimeout(() => { initial = false; }, 2000);
    return () => { unsub(); queueRef.current = []; };
  }, [sessionId]);

  return (
    <div className="fixed top-16 right-4 space-y-2 z-40" role="log" aria-label="참여자 알림" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <Avatar name={toast.nickname} size="sm" />
            <span>{toast.nickname}님 입장!</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
