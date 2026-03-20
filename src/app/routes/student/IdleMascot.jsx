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
          style={{ transformOrigin: '60px 60px' }}
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

          {/* Left ear */}
          <motion.g animate={leftEar} style={{ transformOrigin: '34px 34px' }}>
            <circle cx="34" cy="34" r="8" fill="#F59E0B" />
            <circle cx="34" cy="34" r="5" fill="#FDE68A" />
          </motion.g>

          {/* Right ear */}
          <motion.g animate={rightEar} style={{ transformOrigin: '86px 34px' }}>
            <circle cx="86" cy="34" r="8" fill="#F59E0B" />
            <circle cx="86" cy="34" r="5" fill="#FDE68A" />
          </motion.g>

          {/* Eyes group -- translates for look L/R */}
          <motion.g animate={eyes}>
            {/* Blink group -- scaleY for blink */}
            <motion.g animate={blink} style={{ transformOrigin: '60px 57px' }}>
              <ellipse cx="48" cy="57" rx="5" ry="5.5" fill="#1E293B" />
              <ellipse cx="72" cy="57" rx="5" ry="5.5" fill="#1E293B" />
            </motion.g>
          </motion.g>

          {/* Eye shines */}
          <circle cx="46" cy="55" r="2" fill="white" />
          <circle cx="70" cy="55" r="2" fill="white" />

          {/* Nose */}
          <ellipse cx="60" cy="66" rx="3.5" ry="2.5" fill="#D97706" />

          {/* Mouth */}
          <motion.path
            d="M53 71 Q60 77 67 71"
            stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />

          {/* Cheeks */}
          <circle cx="39" cy="66" r="5" fill="#FBBF24" opacity="0.4" />
          <circle cx="81" cy="66" r="5" fill="#FBBF24" opacity="0.4" />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
