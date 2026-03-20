import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const IDLE_ACTIONS = ['lookLeft', 'lookRight', 'tilt', 'doubleBlink', 'antennaWiggle'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pinggo mascot with random idle animations on the WaitingPage.
 *
 * Continuous: breathing float, antenna pulse.
 * Random (3-6s): look left/right (eyes translate), curious tilt (body rotate),
 * double-blink (eye scaleY), antenna wiggle (antenna rotate).
 *
 * Uses useAnimationControls for imperative sequencing.
 * Eye look uses translateX on a <g> wrapper (reliable SVG transform).
 */
export default function IdleMascot() {
  const eyes = useAnimationControls();
  const blink = useAnimationControls();
  const body = useAnimationControls();
  const antenna = useAnimationControls();
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

        case 'antennaWiggle':
          await antenna.start({
            rotate: [0, 15, -12, 8, -4, 0],
            transition: { duration: 0.65, ease: 'easeInOut' },
          });
          break;

        default:
          break;
      }
    } catch {
      // Animation interrupted (unmount) -- ignore
    }
    busyRef.current = false;
  }, [eyes, blink, body, antenna]);

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
          style={{ transformOrigin: '60px 68px' }}
        >
          <circle cx="60" cy="68" r="32" fill="#1E293B" />
          <ellipse cx="60" cy="62" rx="24" ry="20" fill="#334155" opacity="0.5" />

          {/* Eyes group -- translates for look L/R */}
          <motion.g animate={eyes}>
            {/* Blink group -- scaleY for blink */}
            <motion.g animate={blink} style={{ transformOrigin: '60px 65px' }}>
              <ellipse cx="50" cy="65" rx="4" ry="4.5" fill="white" />
              <ellipse cx="70" cy="65" rx="4" ry="4.5" fill="white" />
            </motion.g>
          </motion.g>

          {/* Smile */}
          <motion.path
            d="M52 76 Q60 82 68 76"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.g>

        {/* Antenna group -- wiggles */}
        <motion.g
          animate={antenna}
          style={{ transformOrigin: '60px 36px' }}
        >
          <line
            x1="60" y1="36" x2="60" y2="24"
            stroke="#1E293B" strokeWidth="3" strokeLinecap="round"
          />
          <motion.circle
            cx="60" cy="21" r="5" fill="#64748B"
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Signal waves */}
        <motion.path
          d="M76 18 Q82 10 76 2"
          stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none"
          animate={{ opacity: [0, 0.5, 0], pathLength: [0, 1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M84 22 Q92 10 84 -2"
          stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none"
          animate={{ opacity: [0, 0.3, 0], pathLength: [0, 1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
        />
      </motion.svg>
    </motion.div>
  );
}
