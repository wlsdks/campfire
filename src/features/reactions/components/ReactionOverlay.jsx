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
    left: 10 + (seed % 76),
    drift: ((Math.floor(seed / 7) % 56) - 28) * 3,
    size: 54 + (Math.floor(seed / 17) % 16),
    duration: (timing.reactionBubbleLifetime + 1200 + (seed % 900)) / 1000,
    rotate: (Math.floor(seed / 13) % 20) - 10,
    sway: 10 + (Math.floor(seed / 29) % 10),
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
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_top,black_75%,transparent)]">
      <AnimatePresence>
        {bubbles.map((bubble) => {
          const reaction = REACTION_META[bubble.type] || REACTION_META.thumbsup;
          const Icon = reaction.icon;

          return (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.76, rotate: -bubble.rotate }}
              animate={{
                opacity: [0, 1, 0.96, 0],
                y: [0, -160, -460, -1080],
                x: [0, bubble.sway, -bubble.sway * 0.8, bubble.drift],
                scale: [0.76, 1, 1.05, 1.1],
                rotate: [-bubble.rotate, bubble.rotate * 0.2, -bubble.rotate * 0.35, bubble.rotate],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: bubble.duration,
                ease: 'easeOut',
                times: [0, 0.18, 0.72, 1],
              }}
              className="absolute bottom-[max(4.75rem,env(safe-area-inset-bottom))]"
              style={{ left: `${bubble.left}%` }}
            >
              <div
                className={`relative flex items-center justify-center rounded-full border bg-gradient-to-br ${reaction.bubbleShell} ${reaction.bubbleBorder} ${reaction.bubbleShadow} backdrop-blur-[2px]`}
                style={{ width: bubble.size, height: bubble.size }}
              >
                <div className="absolute left-[18%] top-[14%] h-[24%] w-[24%] rounded-full bg-white/75 blur-[1px]" />
                <div className="absolute right-[20%] top-[22%] h-[10%] w-[10%] rounded-full bg-white/80" />
                <div className={`absolute -right-1 top-[26%] h-2.5 w-2.5 rounded-full ${reaction.bubbleTrail}`} />
                <div className={`absolute -left-1 top-[48%] h-1.5 w-1.5 rounded-full ${reaction.bubbleTrail}`} />
                <div className="absolute inset-[7px] rounded-full border border-white/40 bg-white/55" />
                <Icon size={Math.round(bubble.size * 0.42)} className={`relative z-10 ${reaction.bubbleIcon}`} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
