import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const RATIO = 461 / 512;
const H = 140;
const IDLE_ACTIONS = ['peekLeft', 'peekRight', 'tilt', 'wiggle', 'nod', 'bounce'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * WaitingPage의 Pick 픽셀 마스코트 — 랜덤 idle 동작.
 * 연속: 숨쉬기 float. 랜덤(3-6s): 좌우 살짝 보기(x 이동), 갸웃(rotate),
 * 살랑(rotate wiggle), 끄덕(nod), 통통 바운스(scale). 래스터 이미지라 몸통 전체 변형만 사용.
 */
export default function IdleMascot() {
  const body = useAnimationControls();
  const busyRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const runAction = useCallback(async (action) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const s = { type: 'spring', stiffness: 300, damping: 25 };
    try {
      switch (action) {
        case 'peekLeft':
          await body.start({ x: -6, transition: { duration: 0.25 } });
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
          await body.start({ x: 0, transition: s });
          break;
        case 'peekRight':
          await body.start({ x: 6, transition: { duration: 0.25 } });
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
          await body.start({ x: 0, transition: s });
          break;
        case 'tilt':
          await body.start({ rotate: 6, transition: { duration: 0.35 } });
          await new Promise((r) => setTimeout(r, 400));
          await body.start({ rotate: -3, transition: s });
          await new Promise((r) => setTimeout(r, 200));
          await body.start({ rotate: 0, transition: s });
          break;
        case 'wiggle':
          await body.start({ rotate: [0, -7, 6, -4, 2, 0], transition: { duration: 0.7, ease: 'easeInOut' } });
          break;
        case 'nod':
          await body.start({ rotate: 10, transition: { duration: 0.18 } });
          await new Promise((r) => setTimeout(r, 150));
          await body.start({ rotate: -5, transition: { type: 'spring', stiffness: 400, damping: 20 } });
          await new Promise((r) => setTimeout(r, 80));
          await body.start({ rotate: 0, transition: s });
          break;
        case 'bounce':
          await body.start({ scale: 1.08, transition: { type: 'spring', stiffness: 500, damping: 18 } });
          await body.start({ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 20 } });
          await body.start({ scale: 1, transition: s });
          break;
        default:
          break;
      }
    } catch {
      // 애니 중단(언마운트) — 무시
    }
    busyRef.current = false;
  }, [body]);

  // 랜덤 idle 동작 스케줄
  useEffect(() => {
    if (!mounted) return;
    let timer;
    let cancelled = false; // 언마운트 후 await가 끝나며 고아 체인 생성 차단
    const schedule = () => {
      if (cancelled) return;
      const delay = 3000 + Math.random() * 3000;
      timer = setTimeout(async () => {
        if (cancelled) return;
        await runAction(pick(IDLE_ACTIONS));
        if (cancelled) return;
        schedule();
      }, delay);
    };
    timer = setTimeout(() => {
      if (cancelled) return;
      runAction(pick(IDLE_ACTIONS)).then(() => { if (!cancelled) schedule(); });
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mounted, runAction]);

  const w = Math.round(H * RATIO);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        scale: { type: 'spring', stiffness: 300, damping: 25 },
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.img
          src="/mascot.png?v=pixel"
          alt=""
          aria-hidden="true"
          width={w}
          height={H}
          draggable={false}
          animate={body}
          style={{ display: 'block', width: w, height: H, objectFit: 'contain', userSelect: 'none', transformOrigin: '50% 60%' }}
        />
      </motion.div>
    </motion.div>
  );
}
