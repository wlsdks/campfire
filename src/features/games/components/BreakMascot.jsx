import { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Break mascot — lion face with spinning mane.
 * Face stays still, mane bumps rotate continuously.
 * Simple and charming, avoids full-body proportion issues.
 */
export default memo(function BreakMascot({ size = 140 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      {/* Spinning mane bumps */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '60px 60px' }}
      >
        <circle cx="60" cy="18" r="14" fill="#F59E0B" />
        <circle cx="35" cy="24" r="13" fill="#FBBF24" />
        <circle cx="84" cy="24" r="13" fill="#FBBF24" />
        <circle cx="20" cy="44" r="13" fill="#F59E0B" />
        <circle cx="100" cy="44" r="13" fill="#F59E0B" />
        <circle cx="18" cy="68" r="12" fill="#FBBF24" />
        <circle cx="102" cy="68" r="12" fill="#FBBF24" />
        <circle cx="24" cy="88" r="12" fill="#F59E0B" />
        <circle cx="96" cy="88" r="12" fill="#F59E0B" />
        <circle cx="40" cy="100" r="11" fill="#FBBF24" />
        <circle cx="80" cy="100" r="11" fill="#FBBF24" />
        <circle cx="60" cy="104" r="11" fill="#F59E0B" />
      </motion.g>

      {/* Static mane fill (behind face) */}
      <circle cx="60" cy="60" r="38" fill="#F59E0B" />

      {/* Face */}
      <circle cx="60" cy="62" r="30" fill="#FDE68A" />

      {/* Ears */}
      <circle cx="34" cy="34" r="8" fill="#F59E0B" />
      <circle cx="34" cy="34" r="5" fill="#FDE68A" />
      <circle cx="86" cy="34" r="8" fill="#F59E0B" />
      <circle cx="86" cy="34" r="5" fill="#FDE68A" />

      {/* Eyes — blink */}
      <motion.ellipse cx="48" cy="57" rx="5" ry="5.5" fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="46" cy="55" r="2" fill="white" />
      <motion.ellipse cx="72" cy="57" rx="5" ry="5.5" fill="#1E293B"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />
      <circle cx="70" cy="55" r="2" fill="white" />

      {/* Nose */}
      <ellipse cx="60" cy="66" rx="3.5" ry="2.5" fill="#D97706" />

      {/* Mouth — happy */}
      <path d="M53 71 Q60 78 67 71" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <circle cx="39" cy="66" r="5" fill="#FBBF24" opacity="0.35" />
      <circle cx="81" cy="66" r="5" fill="#FBBF24" opacity="0.35" />
    </svg>
  );
});
