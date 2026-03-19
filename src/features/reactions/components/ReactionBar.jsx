import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReactions } from '@/features/reactions/api/useReactions';
import { REACTIONS } from '@/features/reactions/reactionConfig';

export default function ReactionBar({ sessionId }) {
  const { sendReaction } = useReactions(sessionId);
  const [lastSent, setLastSent] = useState(null);
  const flashTimerRef = useRef(null);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  async function handleReaction(type) {
    const sent = await sendReaction(type);
    if (sent) {
      setLastSent(type);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setLastSent(null), 220);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {REACTIONS.map(({ type, icon: Icon, label, buttonClass, activeClass }) => {
        const isActive = lastSent === type;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.88 }}
            whileHover={{ y: -2 }}
            onClick={() => handleReaction(type)}
            aria-label={label}
            className={`relative flex h-11 w-11 items-center justify-center rounded-[18px] border transition-all ${
              isActive
                ? activeClass
                : buttonClass
            }`}
          >
            <span className="absolute inset-[5px] rounded-[14px] bg-white/70" />
            <Icon size={18} className="relative z-10" />
          </motion.button>
        );
      })}
    </div>
  );
}
