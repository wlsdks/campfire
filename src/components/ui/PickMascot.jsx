import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pick mascot — minimal cute lion.
 * Round face, simple mane ring, big eyes, tiny smile.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 * @param {string} mood — 'happy' | 'waiting' | 'thinking'
 */
export default function PickMascot({ size = 'md', mood = 'happy' }) {
  const px = SIZES[size] || SIZES.md;

  const mouthPath =
    mood === 'thinking'
      ? 'M55 72 L65 72'
      : 'M53 71 Q60 77 67 71';

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
      {/* Mane — simple soft circle behind head */}
      <circle cx="60" cy="60" r="44" fill="#FBBF24" />

      {/* Face */}
      <circle cx="60" cy="63" r="32" fill="#FDE68A" />

      {/* Left ear */}
      <circle cx="30" cy="35" r="12" fill="#FBBF24" />
      <circle cx="30" cy="35" r="7" fill="#FDE68A" />

      {/* Right ear */}
      <circle cx="90" cy="35" r="12" fill="#FBBF24" />
      <circle cx="90" cy="35" r="7" fill="#FDE68A" />

      {/* Left eye */}
      <motion.ellipse
        cx="48"
        cy="58"
        rx="5"
        ry="5.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="46" cy="56" r="2" fill="white" />

      {/* Right eye */}
      <motion.ellipse
        cx="72"
        cy="58"
        rx="5"
        ry="5.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="70" cy="56" r="2" fill="white" />

      {/* Nose */}
      <ellipse cx="60" cy="66" rx="3.5" ry="2.5" fill="#D97706" />

      {/* Mouth */}
      <path
        d={mouthPath}
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheeks — subtle blush */}
      <circle cx="39" cy="67" r="5" fill="#FBBF24" opacity="0.4" />
      <circle cx="81" cy="67" r="5" fill="#FBBF24" opacity="0.4" />
    </motion.svg>
  );
}
