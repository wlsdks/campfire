import { memo } from 'react';
import { motion } from 'framer-motion';

const RATIO = 461 / 512; // 픽셀 마스코트 가로/세로 비율

/**
 * 쉬는시간 마스코트 — Pick 픽셀 사자. 부드러운 바브 + 살랑 흔들림.
 */
export default memo(function BreakMascot({ size = 140 }) {
  const w = Math.round(size * RATIO);
  return (
    <motion.img
      src="/mascot.png?v=pixel"
      alt=""
      aria-hidden="true"
      width={w}
      height={size}
      draggable={false}
      style={{ display: 'block', width: w, height: size, objectFit: 'contain', userSelect: 'none' }}
      animate={{ y: [0, -10, 0], rotate: [-2.5, 2.5, -2.5] }}
      transition={{
        y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
});
