import { motion } from 'framer-motion';

const RATIO = 461 / 512;
const H = 96;

/** 수업 종료 축하 마스코트 — Pick 픽셀 사자. 통통 등장 + 부드러운 바브. */
export default function CelebrationMascot() {
  const w = Math.round(H * RATIO);
  return (
    <motion.img
      src="/mascot.png?v=pixel"
      alt=""
      aria-hidden="true"
      width={w}
      height={H}
      draggable={false}
      style={{ display: 'block', width: w, height: H, objectFit: 'contain', userSelect: 'none' }}
      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -6, 0] }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: 'spring', stiffness: 400, damping: 22, delay: 0.1 },
        rotate: { type: 'spring', stiffness: 300, damping: 25, delay: 0.1 },
        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
      }}
    />
  );
}
