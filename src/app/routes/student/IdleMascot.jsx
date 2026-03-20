import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const IDLE_ACTIONS = ['lookLeft', 'lookRight', 'tilt', 'doubleBlink', 'earWiggle'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick mascot with random idle animations on the WaitingPage.
 *
 * Continuous: breathing float.
 * Random (3-6s): look left/right (eyes translate), curious tilt (body rotate),
 * double-blink (eye scaleY), ear wiggle (ears rotate).
 *
 * Uses useAnimationControls for imperative sequencing.
 * Eye look uses translateX on a <g> wrapper (reliable SVG transform).
 */
export default function IdleMascot() {
  const eyes = useAnimationControls();
  const blink = useAnimationControls();
  const body = useAnimationControls();
  const leftEar = useAnimationControls();
  const rightEar = useAnimationControls();
  const busyRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const runAction = useCallback(async (action) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const s = { type: 'spring', stiffness: 300, damping: 24 };

    try {
      switch (action) {
        case 'lookLeft':
          await eyes.start({ x: -4, transition: { duration: 0.25 } });
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
          await eyes.start({ x: 0, transition: s });
          break;

        case 'lookRight':
          await eyes.start({ x: 4, transition: { duration: 0.25 } });
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
          await eyes.start({ x: 0, transition: s });
          break;

        case 'tilt':
          await body.start({ rotate: 6, transition: { duration: 0.35 } });
          await new Promise((r) => setTimeout(r, 400));
          await body.start({ rotate: -3, transition: s });
          await new Promise((r) => setTimeout(r, 200));
          await body.start({ rotate: 0, transition: s });
          break;

        case 'doubleBlink': {
          const doBlink = async () => {
            await blink.start({ scaleY: 0.08, transition: { duration: 0.06 } });
            await blink.start({ scaleY: 1, transition: { duration: 0.1 } });
          };
          await doBlink();
          await new Promise((r) => setTimeout(r, 120));
          await doBlink();
          break;
        }

        case 'earWiggle':
          await Promise.all([
            leftEar.start({
              rotate: [0, -15, 12, -8, 4, 0],
              transition: { duration: 0.65, ease: 'easeInOut' },
            }),
            rightEar.start({
              rotate: [0, 15, -12, 8, -4, 0],
              transition: { duration: 0.65, ease: 'easeInOut' },
            }),
          ]);
          break;

        default:
          break;
      }
    } catch {
      // Animation interrupted (unmount) -- ignore
    }
    busyRef.current = false;
  }, [eyes, blink, body, leftEar, rightEar]);

  // Schedule random idle actions
  useEffect(() => {
    if (!mounted) return;
    let timer;
    const schedule = () => {
      const delay = 3000 + Math.random() * 3000;
      timer = setTimeout(async () => {
        await runAction(pick(IDLE_ACTIONS));
        schedule();
      }, delay);
    };
    timer = setTimeout(() => {
      runAction(pick(IDLE_ACTIONS)).then(schedule);
    }, 2500);
    return () => clearTimeout(timer);
  }, [mounted, runAction]);

  // Periodic natural blink (separate from double-blink action)
  useEffect(() => {
    if (!mounted) return;
    let timer;
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2500;
      timer = setTimeout(async () => {
        if (!busyRef.current) {
          try {
            await blink.start({ scaleY: 0.08, transition: { duration: 0.07 } });
            await blink.start({ scaleY: 1, transition: { duration: 0.12 } });
          } catch { /* unmounted */ }
        }
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timer);
  }, [mounted, blink]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        scale: { type: 'spring', stiffness: 260, damping: 22 },
      }}
    >
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Body group -- tilts */}
        <motion.g
          animate={body}
          style={{ transformOrigin: '60px 62px' }}
        >
          {/* Mane — warm golden ring behind head */}
          <circle cx="60" cy="62" r="42" fill="#D97706" />
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
          <motion.g animate={leftEar} style={{ transformOrigin: '35px 38px' }}>
            <circle cx="35" cy="38" r="10" fill="#D97706" />
            <circle cx="35" cy="38" r="6" fill="#FBBF24" />
          </motion.g>

          {/* Right ear */}
          <motion.g animate={rightEar} style={{ transformOrigin: '85px 38px' }}>
            <circle cx="85" cy="38" r="10" fill="#D97706" />
            <circle cx="85" cy="38" r="6" fill="#FBBF24" />
          </motion.g>

          {/* Eyes group -- translates for look L/R */}
          <motion.g animate={eyes}>
            {/* Blink group -- scaleY for blink */}
            <motion.g animate={blink} style={{ transformOrigin: '60px 62px' }}>
              <ellipse cx="50" cy="62" rx="4" ry="4.5" fill="#1E293B" />
              <ellipse cx="70" cy="62" rx="4" ry="4.5" fill="#1E293B" />
            </motion.g>
          </motion.g>

          {/* Eye shines (outside blink group so they don't squish) */}
          <circle cx="48" cy="60" r="1.5" fill="white" />
          <circle cx="68" cy="60" r="1.5" fill="white" />

          {/* Nose */}
          <ellipse cx="60" cy="72" rx="4" ry="3" fill="#92400E" />

          {/* Mouth */}
          <motion.path
            d="M52 78 Q60 84 68 78"
            stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />

          {/* Whiskers — left */}
          <line x1="32" y1="68" x2="44" y2="70" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="33" y1="74" x2="44" y2="74" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

          {/* Whiskers — right */}
          <line x1="76" y1="70" x2="88" y2="68" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="76" y1="74" x2="87" y2="74" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
