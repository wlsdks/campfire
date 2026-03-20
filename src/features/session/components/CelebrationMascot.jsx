import { motion } from 'framer-motion';

/** Mascot with happy eyes and sparkles for session end celebration. */
export default function CelebrationMascot() {
  return (
    <motion.svg
      width="80"
      height="80"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
    >
      {/* Body */}
      <circle cx="60" cy="68" r="32" fill="#1E293B" />
      <ellipse cx="60" cy="62" rx="24" ry="20" fill="#334155" opacity="0.5" />

      {/* Happy eyes */}
      <motion.path
        d="M44 63 Q50 57 56 63"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d="M64 63 Q70 57 76 63"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      />

      {/* Wide smile */}
      <motion.path
        d="M48 76 Q60 86 72 76"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />

      {/* Antenna */}
      <line x1="60" y1="36" x2="60" y2="24" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      <motion.circle
        cx="60" cy="21" r="5" fill="#64748B"
        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Sparkles */}
      <motion.path d="M26 40 L28 36 L30 40 L26 40" fill="#94A3B8"
        animate={{ opacity: [0, 0.6, 0], y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.path d="M90 50 L92 46 L94 50 L90 50" fill="#94A3B8"
        animate={{ opacity: [0, 0.5, 0], y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />
      <motion.path d="M82 28 L84 24 L86 28 L82 28" fill="#94A3B8"
        animate={{ opacity: [0, 0.4, 0], y: [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
      />
    </motion.svg>
  );
}
