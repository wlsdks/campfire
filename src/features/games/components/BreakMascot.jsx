import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

const ACTIONS = ['idle', 'dance', 'walk', 'stretch', 'wave'];
const ACTION_DURATION = 6000;

/**
 * Full-body animated lion mascot for break timer.
 * Cycles through idle/dance/walk/stretch/wave every 6s.
 * All body parts overlap — no gaps between head/body/legs.
 */
export default memo(function BreakMascot({ size = 140 }) {
  const [action, setAction] = useState('idle');

  useEffect(() => {
    const timer = setInterval(() => {
      setAction(prev => {
        const others = ACTIONS.filter(a => a !== prev);
        return others[Math.floor(Math.random() * others.length)];
      });
    }, ACTION_DURATION);
    return () => clearInterval(timer);
  }, []);

  const walk = action === 'walk';
  const dance = action === 'dance';
  const stretch = action === 'stretch';
  const wave = action === 'wave';

  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 140 190" fill="none" aria-hidden="true">
      <motion.g
        animate={{ x: walk ? [-20, 0, 20, 0] : 0 }}
        transition={walk ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
      >
        {/* === Legs (behind body) === */}
        {/* Left leg */}
        <motion.g
          animate={{ rotate: walk ? [-12, 12, -12] : dance ? [-8, 8, -8] : 0 }}
          transition={walk || dance ? { duration: walk ? 0.6 : 0.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
          style={{ originX: '56px', originY: '130px' }}
        >
          <rect x="50" y="130" width="14" height="24" rx="7" fill="#F59E0B" />
          <ellipse cx="57" cy="156" rx="9" ry="5" fill="#D97706" />
        </motion.g>

        {/* Right leg */}
        <motion.g
          animate={{ rotate: walk ? [12, -12, 12] : dance ? [8, -8, 8] : 0 }}
          transition={walk || dance ? { duration: walk ? 0.6 : 0.4, repeat: Infinity, ease: 'easeInOut', delay: walk ? 0.3 : 0.2 } : { duration: 0.4 }}
          style={{ originX: '84px', originY: '130px' }}
        >
          <rect x="76" y="130" width="14" height="24" rx="7" fill="#F59E0B" />
          <ellipse cx="83" cy="156" rx="9" ry="5" fill="#D97706" />
        </motion.g>

        {/* === Body (covers leg tops) === */}
        <motion.rect
          x="44" y="82" width="52" height="55" rx="20"
          fill="#FDE68A"
          stroke="#F59E0B" strokeWidth="2.5"
          animate={{
            y: dance ? [82, 77, 82] : stretch ? [78, 82] : 82,
            scaleY: stretch ? [1, 1.06, 1] : 1,
            rotate: dance ? [-2, 2, -2] : 0,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
          style={{ originX: '70px', originY: '110px' }}
        />

        {/* Belly dot */}
        <circle cx="70" cy="108" r="10" fill="#FEF3C7" />

        {/* === Arms (on top of body) === */}
        {/* Left arm */}
        <motion.rect
          x="30" y="88" width="12" height="28" rx="6"
          fill="#F59E0B"
          animate={{
            rotate: dance ? [-25, 25, -25] : stretch ? [-40, -25, -40] : wave ? [0, 0] : walk ? [-8, 8, -8] : [0, -4, 0],
            y: stretch ? [80, 88] : 88,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '36px', originY: '88px' }}
        />

        {/* Right arm */}
        <motion.rect
          x="98" y="88" width="12" height="28" rx="6"
          fill="#F59E0B"
          animate={{
            rotate: dance ? [25, -25, 25] : stretch ? [40, 25, 40] : wave ? [-80, -60, -80] : walk ? [8, -8, 8] : [0, 4, 0],
            y: wave ? [76, 76] : stretch ? [80, 88] : 88,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 } : wave ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity, delay: 0.3 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '104px', originY: '88px' }}
        />

        {/* === Head (on top of everything, overlaps body top) === */}
        <motion.g
          animate={{
            y: dance ? [-5, 0, -5] : walk ? [-2, 0, -2] : stretch ? [-6, 0] : [0, -3, 0],
            rotate: wave ? [0, 4, 0] : dance ? [-2, 2, -2] : 0,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '70px', originY: '50px' }}
        >
          {/* Mane bumps */}
          <circle cx="70" cy="24" r="11" fill="#F59E0B" />
          <circle cx="54" cy="28" r="10" fill="#F59E0B" />
          <circle cx="86" cy="28" r="10" fill="#F59E0B" />
          <circle cx="46" cy="40" r="10" fill="#F59E0B" />
          <circle cx="94" cy="40" r="10" fill="#F59E0B" />
          <circle cx="46" cy="56" r="9" fill="#F59E0B" />
          <circle cx="94" cy="56" r="9" fill="#F59E0B" />
          <circle cx="52" cy="68" r="8" fill="#F59E0B" />
          <circle cx="88" cy="68" r="8" fill="#F59E0B" />
          <circle cx="70" cy="72" r="8" fill="#F59E0B" />

          {/* Mane fill — connects to body */}
          <circle cx="70" cy="48" r="27" fill="#F59E0B" />

          {/* Neck bridge — fills gap between head and body */}
          <rect x="55" y="70" width="30" height="18" fill="#F59E0B" />

          {/* Face */}
          <circle cx="70" cy="50" r="21" fill="#FDE68A" />

          {/* Ears */}
          <circle cx="48" cy="26" r="6" fill="#F59E0B" />
          <circle cx="48" cy="26" r="3.5" fill="#FDE68A" />
          <circle cx="92" cy="26" r="6" fill="#F59E0B" />
          <circle cx="92" cy="26" r="3.5" fill="#FDE68A" />

          {/* Eyes */}
          <motion.ellipse
            cx="61" cy="46" rx="3.5" ry="4"
            fill="#1E293B"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
          />
          <circle cx="59.5" cy="44.5" r="1.5" fill="white" />
          <motion.ellipse
            cx="79" cy="46" rx="3.5" ry="4"
            fill="#1E293B"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
          />
          <circle cx="77.5" cy="44.5" r="1.5" fill="white" />

          {/* Nose */}
          <ellipse cx="70" cy="54" rx="2.5" ry="2" fill="#D97706" />

          {/* Mouth */}
          <path
            d={dance || wave ? 'M64 58 Q70 65 76 58' : 'M65 59 Q70 63 75 59'}
            stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none"
          />

          {/* Cheek blush */}
          <circle cx="54" cy="54" r="4" fill="#FBBF24" opacity="0.35" />
          <circle cx="86" cy="54" r="4" fill="#FBBF24" opacity="0.35" />
        </motion.g>
      </motion.g>
    </svg>
  );
});
