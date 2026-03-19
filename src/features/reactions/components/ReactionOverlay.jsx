import { useEffect, useRef, useState } from 'react';
import { limitToLast, onChildAdded, query, ref } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { limits, timing } from '@/lib/design-tokens';
import { REACTION_META } from '@/features/reactions/reactionConfig';

function hashSeed(value) {
  return String(value).split('').reduce((seed, char, index) => (
    (seed * 33 + char.charCodeAt(0) + index) % 2147483647
  ), 7);
}

function createBubbleConfig(key, type) {
  const seed = hashSeed(key);
  return {
    id: `${key}-${type}`,
    type,
    left: 12 + (seed % 72),
    drift: ((Math.floor(seed / 7) % 40) - 20) * 2,
    size: 42 + (Math.floor(seed / 17) % 12),
    duration: (timing.reactionBubbleLifetime + 800 + (seed % 600)) / 1000,
    rotate: (Math.floor(seed / 13) % 12) - 6,
  };
}

export default function ReactionOverlay({ sessionId }) {
  const [bubbles, setBubbles] = useState([]);
  const mountedRef = useRef(true);
  const warmupTimerRef = useRef(null);
  const cleanupTimersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
      cleanupTimersRef.current.forEach(clearTimeout);
      cleanupTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let ready = false;
    warmupTimerRef.current = setTimeout(() => {
      ready = true;
    }, 400);

    const reactionsRef = query(ref(db, `sessions/${sessionId}/reactions`), limitToLast(24));
    const unsubscribe = onChildAdded(reactionsRef, (snapshot) => {
      if (!ready || !mountedRef.current) return;

      const latest = snapshot.val();
      if (!latest?.type) return;

      const bubble = createBubbleConfig(snapshot.key, latest.type);
      setBubbles((prev) => [...prev.slice(-(limits.maxReactionBubbles - 1)), bubble]);

      const removeTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        setBubbles((prev) => prev.filter((item) => item.id !== bubble.id));
      }, bubble.duration * 1000);

      cleanupTimersRef.current.push(removeTimer);
    });

    return () => {
      ready = false;
      unsubscribe();
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
      cleanupTimersRef.current.forEach(clearTimeout);
      cleanupTimersRef.current = [];
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {bubbles.map((bubble) => {
          const reaction = REACTION_META[bubble.type] || REACTION_META.thumbsup;
          const Icon = reaction.icon;

          return (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.9, 0.85, 0],
                y: [0, -120, -360, -720],
                x: [0, bubble.drift * 0.3, -bubble.drift * 0.5, bubble.drift],
                scale: [0.5, 1, 1, 0.9],
                rotate: [0, bubble.rotate, -bubble.rotate * 0.5, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: bubble.duration,
                ease: 'easeOut',
                times: [0, 0.15, 0.65, 1],
              }}
              className="absolute bottom-[max(4.75rem,env(safe-area-inset-bottom))]"
              style={{ left: `${bubble.left}%` }}
            >
              <div
                className={`flex items-center justify-center rounded-full border ${reaction.bubbleBg} ${reaction.bubbleBorder} shadow-sm`}
                style={{ width: bubble.size, height: bubble.size }}
              >
                <Icon size={Math.round(bubble.size * 0.44)} className={reaction.bubbleIcon} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
