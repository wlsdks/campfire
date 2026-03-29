import { useId } from 'react';
import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pick mascot — polished cute lion with fluffy mane.
 * Bezier-path mane, gradient shading, expressive eyes.
 * Breathing, bobbing, mood-based expressions.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 * @param {'happy' | 'waiting' | 'thinking' | 'focus'} mood
 */
export default function PickMascot({ size = 'md', mood = 'happy' }) {
  const px = SIZES[size] || SIZES.md;
  const uid = useId();
  const g = (name) => `pick-${uid}-${name}`;

  const mouthPath =
    mood === 'thinking' || mood === 'focus'
      ? 'M56 72 Q60 73 64 72'
      : mood === 'waiting'
        ? 'M55 71 Q60 74 65 71'
        : 'M53 70 Q60 77 67 70';

  // Breathing: subtle scale pulse
  const breathe = { scale: [1, 1.015, 1] };
  const breatheTiming = { duration: 3.5, repeat: Infinity, ease: 'easeInOut' };

  // Bob: gentle float
  const bob = { y: [0, -4, 0] };
  const bobTiming = { duration: 3.5, repeat: Infinity, ease: 'easeInOut' };

  // Head tilt per mood
  const tilt = mood === 'waiting'
    ? { rotate: [0, -2, 0, 2, 0] }
    : mood === 'thinking'
      ? { rotate: [0, -3, 0] }
      : {};
  const tiltTiming = {
    duration: mood === 'thinking' ? 4 : 6,
    repeat: Infinity,
    ease: 'easeInOut',
  };

  const isFocus = mood === 'focus';

  // Blink animation (shared between eyes)
  const blinkAnim = {
    animate: { scaleY: [1, 1, 0.1, 1, 1] },
    transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] },
  };

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      animate={{ ...bob, ...breathe, ...tilt }}
      transition={{ y: bobTiming, scale: breatheTiming, rotate: tiltTiming }}
    >
      <defs>
        {/* Mane gradient — warm center, deeper edges */}
        <radialGradient id={g('mane')} cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#E08A08" />
        </radialGradient>
        {/* Face gradient — subtle 3D: light top-left, warmer bottom */}
        <radialGradient id={g('face')} cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="60%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCD34D" />
        </radialGradient>
        {/* Nose gradient */}
        <radialGradient id={g('nose')} cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#C47A08" />
        </radialGradient>
        {/* Blush gradient — soft fade */}
        <radialGradient id={g('blush')}>
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        {/* Ear inner gradient */}
        <radialGradient id={g('ear')} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
      </defs>

      {/* ── Mane ── fluffy bumps with depth gradient */}
      <circle cx="60" cy="28" r="17" fill={`url(#${g('mane')})`} />
      <circle cx="36" cy="34" r="16" fill={`url(#${g('mane')})`} />
      <circle cx="84" cy="34" r="16" fill={`url(#${g('mane')})`} />
      <circle cx="26" cy="52" r="15" fill={`url(#${g('mane')})`} />
      <circle cx="94" cy="52" r="15" fill={`url(#${g('mane')})`} />
      <circle cx="28" cy="72" r="14" fill={`url(#${g('mane')})`} />
      <circle cx="92" cy="72" r="14" fill={`url(#${g('mane')})`} />
      <circle cx="40" cy="88" r="13" fill={`url(#${g('mane')})`} />
      <circle cx="80" cy="88" r="13" fill={`url(#${g('mane')})`} />
      <circle cx="60" cy="92" r="13" fill={`url(#${g('mane')})`} />
      {/* Mane fill */}
      <circle cx="60" cy="58" r="39" fill={`url(#${g('mane')})`} />

      {/* ── Face ── gradient for depth */}
      <circle cx="60" cy="62" r="30" fill={`url(#${g('face')})`} />

      {/* ── Ears ── with inner gradient */}
      <circle cx="34" cy="34" r="9" fill={`url(#${g('mane')})`} />
      <circle cx="34" cy="34" r="5.5" fill={`url(#${g('ear')})`} />
      <circle cx="86" cy="34" r="9" fill={`url(#${g('mane')})`} />
      <circle cx="86" cy="34" r="5.5" fill={`url(#${g('ear')})`} />

      {/* ── Eyes ── layered: sclera → iris → pupil → highlights */}
      {isFocus ? (
        <>
          {/* Focus: narrow squint */}
          <ellipse cx="48" cy="57" rx="6" ry="2" fill="white" />
          <ellipse cx="48" cy="57" rx="5" ry="1.8" fill="#1E293B" />
          <circle cx="47" cy="56.5" r="1" fill="white" opacity="0.8" />
          <ellipse cx="72" cy="57" rx="6" ry="2" fill="white" />
          <ellipse cx="72" cy="57" rx="5" ry="1.8" fill="#1E293B" />
          <circle cx="71" cy="56.5" r="1" fill="white" opacity="0.8" />
        </>
      ) : (
        <>
          {/* Left eye */}
          <ellipse cx="48" cy="57" rx="7" ry="7.5" fill="white" />
          <motion.ellipse
            cx="48" cy="57" rx="5" ry="5.5" fill="#1E293B"
            {...blinkAnim}
          />
          <circle cx="46" cy="55" r="2.5" fill="white" />
          <circle cx="50" cy="58" r="1" fill="white" opacity="0.4" />

          {/* Right eye */}
          <ellipse cx="72" cy="57" rx="7" ry="7.5" fill="white" />
          <motion.ellipse
            cx="72" cy="57" rx="5" ry="5.5" fill="#1E293B"
            {...blinkAnim}
          />
          <circle cx="70" cy="55" r="2.5" fill="white" />
          <circle cx="74" cy="58" r="1" fill="white" opacity="0.4" />
        </>
      )}

      {/* ── Eyebrows ── subtle mood hint */}
      {mood === 'thinking' && (
        <>
          <path d="M42 49 Q48 47 52 49" stroke="#C47A08" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M68 49 Q72 47 78 49" stroke="#C47A08" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* ── Nose ── gradient for depth */}
      <ellipse cx="60" cy="66" rx="3.5" ry="2.8" fill={`url(#${g('nose')})`} />
      {/* Nose shine */}
      <ellipse cx="59" cy="65" rx="1.5" ry="1" fill="white" opacity="0.3" />

      {/* ── Mouth ── mood-dependent */}
      <path
        d={mouthPath}
        stroke="#C47A08"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Cheeks ── gradient blush */}
      <motion.circle
        cx="38" cy="66" r="7" fill={`url(#${g('blush')})`}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="82" cy="66" r="7" fill={`url(#${g('blush')})`}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </motion.svg>
  );
}
