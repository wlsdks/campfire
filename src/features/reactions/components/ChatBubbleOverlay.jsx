import { useEffect, useRef, useState, memo } from 'react';
import { onChildAdded, ref } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';

const MAX_BUBBLES = 6;
const LIFETIME_MS = 3000;

/**
 * Floating chat bubbles. Only shows NEW bubbles (ignores existing on mount).
 * Uses onChildAdded + skip-initial pattern for dedup.
 */
export default memo(function ChatBubbleOverlay({ sessionId }) {
  const [bubbles, setBubbles] = useState([]);
  const seenRef = useRef(new Set());
  const readyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    readyRef.current = false;
    seenRef.current = new Set();
    return () => { mountedRef.current = false; };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const bubbleRef = ref(db, `sessions/${sessionId}/chatBubbles`);
    let initialLoad = true;

    const unsub = onChildAdded(bubbleRef, (snap) => {
      // Skip all entries from initial load
      if (initialLoad) return;
      if (!mountedRef.current) return;

      const key = snap.key;
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      const data = snap.val();
      if (!data?.text) return;

      const seed = key.split('').reduce((s, c) => (s * 33 + c.charCodeAt(0)) % 2147483647, 7);
      const bubble = {
        id: key,
        text: (data.text || '').slice(0, 20),
        nickname: data.nickname || '',
        x: 20 + (seed % 55),
      };

      setBubbles(prev => [...prev.slice(-(MAX_BUBBLES - 1)), bubble]);
      setTimeout(() => {
        if (mountedRef.current) setBubbles(prev => prev.filter(b => b.id !== key));
      }, LIFETIME_MS);
    });

    // After initial snapshot fires, mark ready
    setTimeout(() => { initialLoad = false; }, 500);

    return () => unsub();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 0, scale: 0.85 }}
            animate={{ opacity: 1, y: -160, scale: 1 }}
            exit={{ opacity: 0, y: -200, scale: 0.8 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="absolute bottom-40"
            style={{ left: `${b.x}%` }}
          >
            <div className="bg-white/85 dark:bg-slate-700/85 backdrop-blur rounded-2xl px-3 py-1.5 shadow-md">
              <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap">{b.text}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{b.nickname}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
