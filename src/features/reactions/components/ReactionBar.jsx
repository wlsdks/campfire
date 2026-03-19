import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReactions } from '@/features/reactions/api/useReactions';
import { REACTIONS } from '@/features/reactions/reactionConfig';

const COOLDOWN_MS = 1500;

export default function ReactionBar({ sessionId }) {
  const { sendReaction } = useReactions(sessionId);
  const [lastSent, setLastSent] = useState(null);
  const [canSend, setCanSend] = useState(true);
  const flashTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
  }, []);

  const handleReaction = useCallback(async (type) => {
    if (!canSend) return;
    const sent = await sendReaction(type);
    if (sent) {
      setLastSent(type);
      setCanSend(false);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setLastSent(null), 300);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => setCanSend(true), COOLDOWN_MS);
    }
  }, [canSend, sendReaction]);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon, label, buttonClass, activeClass }) => {
        const isActive = lastSent === type;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleReaction(type)}
            aria-label={label}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
              isActive ? activeClass : buttonClass
            }`}
          >
            <Icon size={20} />
          </motion.button>
        );
      })}
    </div>
  );
}
