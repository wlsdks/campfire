import { useId } from 'react';
import { motion } from 'framer-motion';

const SIZES = {
  xs: 36,
  sm: 48,
  md: 72,
  lg: 100,
};

/**
 * Pick mascot — extra-cute lion with big sparkly eyes, rounder mane.
 * Breathing, bobbing, mood-based expressions.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 * @param {'happy' | 'waiting' | 'thinking' | 'focus'} mood
 */
export default function PickMascot({ size = 'md', mood = 'happy', className = '' }) {
  const px = SIZES[size] || SIZES.md;
  const uid = useId();
  const g = (name) => `pick-${uid}-${name}`;

  const mouthPath =
    mood === 'thinking' || mood === 'focus'
      ? 'M56 72 Q60 73 64 72'
      : mood === 'waiting'
        ? 'M54 71 Q60 75 66 71'
        : 'M52 70 Q60 79 68 70';

  // Breathing: subtle scale pulse
  const breathe = { scale: [1, 1.02, 1] };
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

  // Blink animation
  const blinkAnim = {
    animate: { scaleY: [1, 1, 0.08, 1, 1] },
    transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] },
  };

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
      animate={{ ...bob, ...breathe, ...tilt }}
      transition={{ y: bobTiming, scale: breatheTiming, rotate: tiltTiming }}
    >
      <defs>
        {/* Mane gradient — warm, soft */}
        <radialGradient id={g('mane')} cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        {/* Face gradient — creamy soft */}
        <radialGradient id={g('face')} cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="50%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
        {/* Nose gradient — soft pink-brown */}
        <radialGradient id={g('nose')} cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#E8A87C" />
          <stop offset="100%" stopColor="#C47A08" />
        </radialGradient>
        {/* Blush gradient — rosy warm */}
        <radialGradient id={g('blush')}>
          <stop offset="0%" stopColor="#F9A8D4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F9A8D4" stopOpacity="0" />
        </radialGradient>
        {/* Ear inner gradient */}
        <radialGradient id={g('ear')} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FECDD3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
        {/* Eye shine gradient */}
        <radialGradient id={g('eyeShine')} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>
      </defs>

      {/* ── Mane ── rounder, fluffier bumps */}
      <circle cx="60" cy="26" r="18" fill={`url(#${g('mane')})`} />
      <circle cx="34" cy="33" r="17" fill={`url(#${g('mane')})`} />
      <circle cx="86" cy="33" r="17" fill={`url(#${g('mane')})`} />
      <circle cx="24" cy="52" r="16" fill={`url(#${g('mane')})`} />
      <circle cx="96" cy="52" r="16" fill={`url(#${g('mane')})`} />
      <circle cx="26" cy="73" r="15" fill={`url(#${g('mane')})`} />
      <circle cx="94" cy="73" r="15" fill={`url(#${g('mane')})`} />
      <circle cx="38" cy="89" r="14" fill={`url(#${g('mane')})`} />
      <circle cx="82" cy="89" r="14" fill={`url(#${g('mane')})`} />
      <circle cx="60" cy="93" r="14" fill={`url(#${g('mane')})`} />
      {/* Mane fill */}
      <circle cx="60" cy="58" r="40" fill={`url(#${g('mane')})`} />

      {/* ── Face ── bigger, rounder */}
      <circle cx="60" cy="62" r="32" fill={`url(#${g('face')})`} />

      {/* ── Ears ── rounder with pink inner */}
      <circle cx="33" cy="33" r="10" fill={`url(#${g('mane')})`} />
      <circle cx="33" cy="33" r="6" fill={`url(#${g('ear')})`} />
      <circle cx="87" cy="33" r="10" fill={`url(#${g('mane')})`} />
      <circle cx="87" cy="33" r="6" fill={`url(#${g('ear')})`} />

      {/* ── Eyes ── bigger, sparklier */}
      {isFocus ? (
        <>
          <ellipse cx="47" cy="57" rx="7" ry="2.5" fill="white" />
          <ellipse cx="47" cy="57" rx="6" ry="2" fill={`url(#${g('eyeShine')})`} />
          <circle cx="46" cy="56.5" r="1.2" fill="white" opacity="0.9" />
          <ellipse cx="73" cy="57" rx="7" ry="2.5" fill="white" />
          <ellipse cx="73" cy="57" rx="6" ry="2" fill={`url(#${g('eyeShine')})`} />
          <circle cx="72" cy="56.5" r="1.2" fill="white" opacity="0.9" />
        </>
      ) : (
        <>
          {/* Left eye — bigger sclera + iris */}
          <ellipse cx="47" cy="57" rx="9" ry="9.5" fill="white" />
          <motion.ellipse
            cx="47" cy="58" rx="6.5" ry="7" fill={`url(#${g('eyeShine')})`}
            {...blinkAnim}
          />
          {/* Big sparkle highlight */}
          <circle cx="44" cy="54.5" r="3" fill="white" />
          {/* Small sparkle */}
          <circle cx="50" cy="59" r="1.5" fill="white" opacity="0.6" />

          {/* Right eye */}
          <ellipse cx="73" cy="57" rx="9" ry="9.5" fill="white" />
          <motion.ellipse
            cx="73" cy="58" rx="6.5" ry="7" fill={`url(#${g('eyeShine')})`}
            {...blinkAnim}
          />
          <circle cx="70" cy="54.5" r="3" fill="white" />
          <circle cx="76" cy="59" r="1.5" fill="white" opacity="0.6" />
        </>
      )}

      {/* ── Eyebrows ── thinking mood */}
      {mood === 'thinking' && (
        <>
          <path d="M40 47 Q47 44 53 47" stroke="#D4A05A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M67 47 Q73 44 80 47" stroke="#D4A05A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* ── Nose ── small, cute */}
      <ellipse cx="60" cy="66" rx="3" ry="2.3" fill={`url(#${g('nose')})`} />
      <ellipse cx="59.2" cy="65.3" rx="1.3" ry="0.8" fill="white" opacity="0.35" />

      {/* ── Mouth ── wider smile */}
      <path
        d={mouthPath}
        stroke="#C47A08"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tongue peek for happy mood */}
      {mood === 'happy' && (
        <ellipse cx="60" cy="76" rx="3.5" ry="2.5" fill="#F9A8D4" opacity="0.7" />
      )}

      {/* ── Cheeks ── bigger, pinker blush */}
      <motion.circle
        cx="35" cy="67" r="9" fill={`url(#${g('blush')})`}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="85" cy="67" r="9" fill={`url(#${g('blush')})`}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      {/* ── Whisker dots ── */}
      <circle cx="39" cy="69" r="0.8" fill="#D4A05A" opacity="0.4" />
      <circle cx="36" cy="72" r="0.8" fill="#D4A05A" opacity="0.4" />
      <circle cx="81" cy="69" r="0.8" fill="#D4A05A" opacity="0.4" />
      <circle cx="84" cy="72" r="0.8" fill="#D4A05A" opacity="0.4" />
    </motion.svg>
  );
}
