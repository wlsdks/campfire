import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactions } from '@/features/reactions/api/useReactions';
import { REACTIONS } from '@/features/reactions/reactionConfig';

const COOLDOWN_MS = 500;
const FLASH_MS = 500;
const PARTICLE_COUNT = 6;

/** Tiny dot particles that burst outward on tap. */
function TapParticles({ color }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * 360;
      const rad = (angle * Math.PI) / 180;
      const distance = 18 + Math.random() * 10;
      return {
        id: i,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        size: 3 + Math.random() * 2,
      };
    })
  ).current;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

/** Single reaction button with tap feedback + particles. */
const ReactionButton = memo(function ReactionButton({ reaction, isFlash, onTap }) {
  const { type, icon: Icon, label, buttonClass, activeClass, accentColor } = reaction;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={isFlash ? {
          scale: [1, 1.15, 1],
          rotate: [0, -6, 6, 0],
        } : { scale: 1, rotate: 0 }}
        transition={isFlash ? {
          duration: 0.35,
          ease: [0.25, 0.1, 0.25, 1],
        } : { duration: 0.15 }}
        onClick={() => onTap(type)}
        aria-label={label}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-200 ${
          isFlash ? activeClass : buttonClass
        }`}
      >
        <Icon
          size={20}
          fill={isFlash && type === 'heart' ? 'currentColor' : 'none'}
        />
      </motion.button>
      <AnimatePresence>
        {isFlash && <TapParticles color={accentColor} />}
      </AnimatePresence>
    </div>
  );
});

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
      {REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.type}
          reaction={reaction}
          isFlash={flashType === reaction.type}
          onTap={handleReaction}
        />
      ))}
    </div>
  );
}
