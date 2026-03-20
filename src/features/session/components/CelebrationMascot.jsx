import { motion } from 'framer-motion';

/** Lion mascot with happy eyes and sparkles for session end celebration. */
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
      {/* Mane — fluffy bumps */}
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
      <circle cx="60" cy="60" r="38" fill="#F59E0B" />

      {/* Face */}
      <circle cx="60" cy="62" r="30" fill="#FDE68A" />

      {/* Ears */}
      <circle cx="34" cy="34" r="8" fill="#F59E0B" />
      <circle cx="34" cy="34" r="5" fill="#FDE68A" />
      <circle cx="86" cy="34" r="8" fill="#F59E0B" />
      <circle cx="86" cy="34" r="5" fill="#FDE68A" />

      {/* Happy eyes (upside-down arcs) */}
      <motion.path
        d="M42 56 Q48 50 54 56"
        stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.path
        d="M66 56 Q72 50 78 56"
        stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      />

      {/* Nose */}
      <ellipse cx="60" cy="64" rx="3.5" ry="2.5" fill="#D97706" />

      {/* Wide smile */}
      <motion.path
        d="M50 69 Q60 78 70 69"
        stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />

      {/* Cheeks */}
      <circle cx="39" cy="65" r="5" fill="#FBBF24" opacity="0.5" />
      <circle cx="81" cy="65" r="5" fill="#FBBF24" opacity="0.5" />

      {/* Sparkles */}
      <motion.path d="M18 30 L20 26 L22 30 L18 30" fill="#FBBF24"
        animate={{ opacity: [0, 0.8, 0], y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.path d="M96 40 L98 36 L100 40 L96 40" fill="#FBBF24"
        animate={{ opacity: [0, 0.6, 0], y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />
      <motion.path d="M88 20 L90 16 L92 20 L88 20" fill="#FBBF24"
        animate={{ opacity: [0, 0.5, 0], y: [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
      />
    </motion.svg>
  );
}
