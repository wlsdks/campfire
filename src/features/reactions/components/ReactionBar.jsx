import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactions } from '@/features/reactions/api/useReactions';
import { REACTIONS } from '@/features/reactions/reactionConfig';

const COOLDOWN_MS = 500;

export default function ReactionBar({ sessionId }) {
  const { sendReaction } = useReactions(sessionId);
  const [lastSent, setLastSent] = useState(null);
  const cooldownRef = useRef(0);

  const handleReaction = useCallback((type) => {
    const now = performance.now();
    if (now - cooldownRef.current < COOLDOWN_MS) return;
    cooldownRef.current = now;

    setLastSent(type);
    sendReaction(type);
  }, [sendReaction]);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon, label, buttonClass, activeClass }) => {
        const isActive = lastSent === type;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleReaction(type)}
            aria-label={label}
            className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
              isActive ? activeClass : buttonClass
            }`}
          >
            <Icon size={20} />
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-xl border border-indigo-300"
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
