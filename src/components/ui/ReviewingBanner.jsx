import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, CheckCircle } from 'lucide-react';

export default function ReviewingBanner({ sessionId }) {
  const [reviewing, setReviewing] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const prevReviewing = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    const urgentRef = ref(db, `sessions/${sessionId}/urgentQuestions`);
    const unsub = onValue(urgentRef, (snap) => {
      const data = snap.val() || {};
      const anyReviewing = Object.values(data).some(q => q.reviewing === true);
      setReviewing(anyReviewing);
    }, () => {});
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (prevReviewing.current && !reviewing) {
      setShowComplete(true);
      const timer = setTimeout(() => setShowComplete(false), 2500);
      return () => clearTimeout(timer);
    }
    prevReviewing.current = reviewing;
  }, [reviewing]);

  return (
    <AnimatePresence>
      {reviewing && (
        <motion.div
          key="reviewing"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
        >
          <Eye size={16} />
          <span>강사가 질문을 확인하고 있어요</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-slate-900/40 animate-pulse" />
        </motion.div>
      )}
      {showComplete && !reviewing && (
        <motion.div
          key="complete"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
        >
          <CheckCircle size={16} />
          <span>확인 완료!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
