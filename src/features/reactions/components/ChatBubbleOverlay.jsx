import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { onValue, ref } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';

const MAX_BUBBLES = 10;
const BUBBLE_LIFETIME_MS = 3500;
const THROTTLE_MS = 250;

function hashSeed(value) {
  return String(value).split('').reduce((s, c, i) => (s * 33 + c.charCodeAt(0) + i) % 2147483647, 7);
}

/**
 * Floating chat bubbles overlay — shows chatBubbles from Firebase.
 * Works on all screens (student, live, presenter).
 */
export default memo(function ChatBubbleOverlay({ sessionId }) {
  const [bubbles, setBubbles] = useState([]);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);
  const prevKeysRef = useRef(new Set());
  const queueRef = useRef([]);
  const drainTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      if (drainTimerRef.current) clearInterval(drainTimerRef.current);
    };
  }, []);

  const startDrain = useCallback(() => {
    if (drainTimerRef.current) return;
    drainTimerRef.current = setInterval(() => {
      if (!mountedRef.current || queueRef.current.length === 0) {
        clearInterval(drainTimerRef.current);
        drainTimerRef.current = null;
        return;
      }
      const item = queueRef.current.shift();
      setBubbles(prev => [...prev.slice(-(MAX_BUBBLES - 1)), item]);
      const tid = setTimeout(() => {
        if (!mountedRef.current) return;
        setBubbles(prev => prev.filter(b => b.id !== item.id));
      }, BUBBLE_LIFETIME_MS);
      timersRef.current.push(tid);
    }, THROTTLE_MS);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const bubbleRef = ref(db, `sessions/${sessionId}/chatBubbles`);
    const unsub = onValue(bubbleRef, snap => {
      if (!mountedRef.current) return;
      const val = snap.val() || {};
      Object.entries(val).forEach(([key, data]) => {
        if (prevKeysRef.current.has(key)) return;
        prevKeysRef.current.add(key);
        const seed = hashSeed(key);
        const xPos = 10 + (seed % 70);
        queueRef.current.push({
          id: key,
          text: (data.text || '').slice(0, 20),
          nickname: data.nickname || '',
          x: xPos,
        });
      });
      if (queueRef.current.length > 0) startDrain();
    });
    return () => unsub();
  }, [sessionId, startDrain]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -200, scale: 1 }}
            exit={{ opacity: 0, y: -300, scale: 0.7 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="absolute bottom-32"
            style={{ left: `${b.x}%` }}
          >
            <div className="bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-2xl px-3.5 py-2 shadow-lg max-w-[180px]">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">{b.text}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{b.nickname}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
