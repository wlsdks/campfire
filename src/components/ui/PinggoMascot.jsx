import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pinggo mascot — round robot with blinking eyes and pulsing antenna.
 * Shared across admin and student screens for empty/waiting states.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 * @param {string} mood — 'happy' | 'waiting' | 'thinking'
 */
export default function PinggoMascot({ size = 'md', mood = 'happy' }) {
  const px = SIZES[size] || SIZES.md;

  // Mouth path varies by mood
  const mouthPath =
    mood === 'thinking'
      ? 'M54 76 Q60 76 66 76'      // flat / neutral
      : 'M52 76 Q60 82 68 76';     // smile

  // Antenna color varies
  const antennaFill = mood === 'waiting' ? '#94A3B8' : '#64748B';

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
      {/* Body */}
      <circle cx="60" cy="68" r="32" fill="#1E293B" />

      {/* Face highlight */}
      <ellipse cx="60" cy="62" rx="24" ry="20" fill="#334155" opacity="0.5" />

      {/* Left eye */}
      <motion.ellipse
        cx="50"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Right eye */}
      <motion.ellipse
        cx="70"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Mouth */}
      <path
        d={mouthPath}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Antenna stick */}
      <line x1="60" y1="36" x2="60" y2="24" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />

      {/* Antenna ball */}
      <motion.circle
        cx="60"
        cy="21"
        r="5"
        fill={antennaFill}
        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Signal wave (visible when waiting or thinking) */}
      {mood !== 'happy' && (
        <motion.path
          d="M76 18 Q82 10 76 2"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}
