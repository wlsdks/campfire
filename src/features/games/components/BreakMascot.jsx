import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

const ACTIONS = ['idle', 'dance', 'walk', 'stretch', 'wave'];
const ACTION_DURATION = 6000; // ms between action changes

/**
 * Full-body animated lion mascot for break timer.
 * Cycles through idle/dance/walk/stretch/wave every 6s.
 * Pure SVG + Framer Motion — no external dependencies.
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

  // Per-action animation configs
  const walk = action === 'walk';
  const dance = action === 'dance';
  const stretch = action === 'stretch';
  const wave = action === 'wave';

  return (
    <svg width={size} height={size * 1.45} viewBox="0 0 140 200" fill="none" aria-hidden="true">
      {/* Whole character — walking movement */}
      <motion.g
        animate={{ x: walk ? [-25, 0, 25, 0] : 0 }}
        transition={walk ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
      >
        {/* Left leg */}
        <motion.g style={{ originX: '55px', originY: '145px' }}>
          <motion.rect
            x="50" y="145" width="14" height="28" rx="7"
            fill="#F59E0B"
            animate={{
              rotate: walk ? [-15, 15, -15] : dance ? [-10, 10, -10] : 0,
            }}
            transition={walk || dance ? { duration: walk ? 0.6 : 0.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
          />
          {/* Foot */}
          <motion.ellipse
            cx="57" cy="175" rx="10" ry="5"
            fill="#D97706"
            animate={{
              cy: walk ? [175, 170, 175] : 175,
              rotate: walk ? [-5, 5, -5] : 0,
            }}
            transition={walk ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        </motion.g>

        {/* Right leg */}
        <motion.g style={{ originX: '85px', originY: '145px' }}>
          <motion.rect
            x="76" y="145" width="14" height="28" rx="7"
            fill="#F59E0B"
            animate={{
              rotate: walk ? [15, -15, 15] : dance ? [10, -10, 10] : 0,
            }}
            transition={walk || dance ? { duration: walk ? 0.6 : 0.4, repeat: Infinity, ease: 'easeInOut', delay: walk ? 0.3 : 0.2 } : { duration: 0.4 }}
          />
          <motion.ellipse
            cx="83" cy="175" rx="10" ry="5"
            fill="#D97706"
            animate={{
              cy: walk ? [175, 170, 175] : 175,
            }}
            transition={walk ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } : { duration: 0.3 }}
          />
        </motion.g>

        {/* Body */}
        <motion.rect
          x="42" y="90" width="56" height="60" rx="20"
          fill="#FDE68A"
          stroke="#F59E0B" strokeWidth="3"
          animate={{
            y: dance ? [90, 84, 90] : stretch ? [85, 90] : 90,
            scaleY: stretch ? [1, 1.08, 1] : 1,
            rotate: dance ? [-3, 3, -3] : 0,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
          style={{ originX: '70px', originY: '120px' }}
        />

        {/* Belly circle */}
        <circle cx="70" cy="118" r="12" fill="#FEF3C7" />

        {/* Left arm */}
        <motion.rect
          x="28" y="95" width="12" height="32" rx="6"
          fill="#F59E0B"
          animate={{
            rotate: dance ? [-30, 30, -30] : stretch ? [-45, -30, -45] : wave ? [0, 0] : walk ? [-10, 10, -10] : [0, -5, 0],
            y: stretch ? [85, 95] : 95,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '34px', originY: '95px' }}
        />

        {/* Right arm */}
        <motion.rect
          x="100" y="95" width="12" height="32" rx="6"
          fill="#F59E0B"
          animate={{
            rotate: dance ? [30, -30, 30] : stretch ? [45, 30, 45] : wave ? [-90, -70, -90] : walk ? [10, -10, 10] : [0, 5, 0],
            y: wave ? [80, 80] : stretch ? [85, 95] : 95,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 } : wave ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity, delay: 0.3 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '106px', originY: '95px' }}
        />

        {/* Head group */}
        <motion.g
          animate={{
            y: dance ? [-6, 0, -6] : walk ? [-2, 0, -2] : stretch ? [-8, 0] : [0, -3, 0],
            rotate: wave ? [0, 5, 0] : dance ? [-3, 3, -3] : 0,
          }}
          transition={dance ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : walk ? { duration: 0.6, repeat: Infinity } : stretch ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '70px', originY: '55px' }}
        >
          {/* Mane bumps */}
          <circle cx="70" cy="28" r="12" fill="#F59E0B" />
          <circle cx="52" cy="32" r="11" fill="#F59E0B" />
          <circle cx="88" cy="32" r="11" fill="#F59E0B" />
          <circle cx="44" cy="46" r="10" fill="#F59E0B" />
          <circle cx="96" cy="46" r="10" fill="#F59E0B" />
          <circle cx="46" cy="62" r="9" fill="#F59E0B" />
          <circle cx="94" cy="62" r="9" fill="#F59E0B" />
          <circle cx="54" cy="74" r="9" fill="#F59E0B" />
          <circle cx="86" cy="74" r="9" fill="#F59E0B" />
          <circle cx="70" cy="76" r="9" fill="#F59E0B" />

          {/* Mane fill */}
          <circle cx="70" cy="52" r="28" fill="#F59E0B" />

          {/* Face */}
          <circle cx="70" cy="54" r="22" fill="#FDE68A" />

          {/* Ears */}
          <circle cx="48" cy="30" r="6" fill="#F59E0B" />
          <circle cx="48" cy="30" r="3.5" fill="#FDE68A" />
          <circle cx="92" cy="30" r="6" fill="#F59E0B" />
          <circle cx="92" cy="30" r="3.5" fill="#FDE68A" />

          {/* Eyes */}
          <motion.ellipse
            cx="60" cy="50" rx="3.5" ry="4"
            fill="#1E293B"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
          />
          <circle cx="58.5" cy="48.5" r="1.5" fill="white" />
          <motion.ellipse
            cx="80" cy="50" rx="3.5" ry="4"
            fill="#1E293B"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
          />
          <circle cx="78.5" cy="48.5" r="1.5" fill="white" />

          {/* Nose */}
          <ellipse cx="70" cy="58" rx="2.5" ry="2" fill="#D97706" />

          {/* Mouth — changes with action */}
          <motion.path
            d={dance || wave ? 'M63 62 Q70 70 77 62' : 'M64 63 Q70 67 76 63'}
            stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none"
          />

          {/* Cheek blush */}
          <circle cx="53" cy="58" r="4" fill="#FBBF24" opacity="0.35" />
          <circle cx="87" cy="58" r="4" fill="#FBBF24" opacity="0.35" />
        </motion.g>
      </motion.g>
    </svg>
  );
});
