import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pick mascot — cute lion with blinking eyes and swaying mane.
 * Shared across admin and student screens for empty/waiting states.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 * @param {string} mood — 'happy' | 'waiting' | 'thinking'
 */
export default function PickMascot({ size = 'md', mood = 'happy' }) {
  const px = SIZES[size] || SIZES.md;

  const mouthPath =
    mood === 'thinking'
      ? 'M54 78 Q60 78 66 78'
      : 'M52 78 Q60 84 68 78';

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Mane — warm golden ring behind head */}
      <motion.circle
        cx="60"
        cy="62"
        r="42"
        fill="#D97706"
        animate={mood === 'waiting' ? { scale: [1, 1.03, 1] } : undefined}
        transition={mood === 'waiting' ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      {/* Mane texture — subtle rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="60"
          cy="20"
          rx="6"
          ry="10"
          fill="#B45309"
          opacity="0.3"
          transform={`rotate(${deg} 60 62)`}
        />
      ))}

      {/* Face — round warm circle */}
      <circle cx="60" cy="65" r="30" fill="#F59E0B" />

      {/* Inner face — lighter */}
      <ellipse cx="60" cy="68" rx="22" ry="18" fill="#FCD34D" opacity="0.5" />

      {/* Left ear */}
      <circle cx="35" cy="38" r="10" fill="#D97706" />
      <circle cx="35" cy="38" r="6" fill="#FBBF24" />

      {/* Right ear */}
      <circle cx="85" cy="38" r="10" fill="#D97706" />
      <circle cx="85" cy="38" r="6" fill="#FBBF24" />

      {/* Left eye */}
      <motion.ellipse
        cx="50"
        cy="62"
        rx="4"
        ry="4.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      {/* Left eye shine */}
      <circle cx="48" cy="60" r="1.5" fill="white" />

      {/* Right eye */}
      <motion.ellipse
        cx="70"
        cy="62"
        rx="4"
        ry="4.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      {/* Right eye shine */}
      <circle cx="68" cy="60" r="1.5" fill="white" />

      {/* Nose */}
      <ellipse cx="60" cy="72" rx="4" ry="3" fill="#92400E" />

      {/* Mouth */}
      <path
        d={mouthPath}
        stroke="#92400E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Whiskers — left */}
      <line x1="32" y1="68" x2="44" y2="70" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="33" y1="74" x2="44" y2="74" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

      {/* Whiskers — right */}
      <line x1="76" y1="70" x2="88" y2="68" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="76" y1="74" x2="87" y2="74" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </motion.svg>
  );
}
