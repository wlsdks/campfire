import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactions } from '@/features/reactions/api/useReactions';
import { REACTIONS } from '@/features/reactions/reactionConfig';

const COOLDOWN_MS = 500;
const FLASH_MS = 400;

export default function ReactionBar({ sessionId }) {
  const { sendReaction } = useReactions(sessionId);
  const [flashType, setFlashType] = useState(null);
  const cooldownRef = useRef(0);
  const flashTimerRef = useRef(null);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  const handleReaction = useCallback((type) => {
    const now = performance.now();
    if (now - cooldownRef.current < COOLDOWN_MS) return;
    cooldownRef.current = now;

    setFlashType(type);
    sendReaction(type);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashType(null), FLASH_MS);
  }, [sendReaction]);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon, label, buttonClass, activeClass }) => {
        const isFlash = flashType === type;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleReaction(type)}
            aria-label={label}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-200 ${
              isFlash ? activeClass : buttonClass
            }`}
          >
            <Icon size={20} />
          </motion.button>
        );
      })}
    </div>
  );
}
