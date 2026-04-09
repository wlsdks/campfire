import { useEffect, useRef, useState, memo } from 'react';
import { onChildAdded, ref, query, orderByChild, startAt } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';

const MAX_BUBBLES = 8;
const BUBBLE_LIFETIME_MS = 3200;

/**
 * Floating chat bubbles — uses onChildAdded to avoid duplicate triggers.
 * Only shows bubbles created AFTER mount (ignores historical data).
 */
export default memo(function ChatBubbleOverlay({ sessionId }) {
  const [bubbles, setBubbles] = useState([]);
  const mountedRef = useRef(true);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    mountedRef.current = true;
    mountTimeRef.current = Date.now();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    // Only listen for bubbles created after mount
    const bubbleQuery = query(
      ref(db, `sessions/${sessionId}/chatBubbles`),
      orderByChild('timestamp'),
      startAt(mountTimeRef.current),
    );

    const unsub = onChildAdded(bubbleQuery, (snap) => {
      if (!mountedRef.current) return;
      const data = snap.val();
      if (!data?.text) return;

      const seed = snap.key.split('').reduce((s, c) => (s * 33 + c.charCodeAt(0)) % 2147483647, 7);
      const bubble = {
        id: snap.key,
        text: (data.text || '').slice(0, 20),
        nickname: data.nickname || '',
        x: 15 + (seed % 60),
      };

      setBubbles(prev => [...prev.slice(-(MAX_BUBBLES - 1)), bubble]);

      setTimeout(() => {
        if (!mountedRef.current) return;
        setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      }, BUBBLE_LIFETIME_MS);
    });

    return () => unsub();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -180, scale: 1 }}
            exit={{ opacity: 0, y: -240, scale: 0.7 }}
            transition={{ duration: 2.8, ease: 'easeOut' }}
            className="absolute bottom-36"
            style={{ left: `${b.x}%` }}
          >
            <div className="bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-md max-w-[160px]">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">{b.text}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{b.nickname}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
