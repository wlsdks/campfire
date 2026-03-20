import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pick mascot — minimal cute lion with fluffy mane.
 * Round face, cloud-like mane bumps, big eyes, tiny smile.
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
      {/* Mane — fluffy bumps around head */}
      <circle cx="60" cy="30" r="16" fill="#F59E0B" />
      <circle cx="38" cy="36" r="15" fill="#F59E0B" />
      <circle cx="82" cy="36" r="15" fill="#F59E0B" />
      <circle cx="28" cy="54" r="14" fill="#F59E0B" />
      <circle cx="92" cy="54" r="14" fill="#F59E0B" />
      <circle cx="30" cy="74" r="13" fill="#F59E0B" />
      <circle cx="90" cy="74" r="13" fill="#F59E0B" />
      <circle cx="42" cy="88" r="12" fill="#F59E0B" />
      <circle cx="78" cy="88" r="12" fill="#F59E0B" />
      <circle cx="60" cy="92" r="12" fill="#F59E0B" />

      {/* Mane fill — cover gaps */}
      <circle cx="60" cy="60" r="38" fill="#F59E0B" />

      {/* Face */}
      <circle cx="60" cy="62" r="30" fill="#FDE68A" />

      {/* Left ear */}
      <circle cx="34" cy="34" r="8" fill="#F59E0B" />
      <circle cx="34" cy="34" r="5" fill="#FDE68A" />

      {/* Right ear */}
      <circle cx="86" cy="34" r="8" fill="#F59E0B" />
      <circle cx="86" cy="34" r="5" fill="#FDE68A" />

      {/* Left eye */}
      <motion.ellipse
        cx="48"
        cy="57"
        rx="5"
        ry="5.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="46" cy="55" r="2" fill="white" />

      {/* Right eye */}
      <motion.ellipse
        cx="72"
        cy="57"
        rx="5"
        ry="5.5"
        fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="70" cy="55" r="2" fill="white" />

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
      <circle cx="39" cy="66" r="5" fill="#FBBF24" opacity="0.4" />
      <circle cx="81" cy="66" r="5" fill="#FBBF24" opacity="0.4" />
    </motion.svg>
  );
}
