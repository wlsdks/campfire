import { motion } from 'framer-motion';

// 높이(px) 기준. 사자 이미지는 세로형(392×512, 비율 ≈ 0.766)이라 width는 비율로 산출.
const SIZES = {
  xs: 36,
  sm: 48,
  md: 80,
  lg: 120,
};
const RATIO = 461 / 512; // 이미지 가로/세로 비율(픽셀아트 마스코트, 거의 정사각)

/**
 * Pick 마스코트 — Aslan 픽셀아트 사자 캐릭터(갈기 가득, 반짝이 표정).
 * 큰 인스턴스(md/lg)만 부드러운 bob/breathe idle 애니메이션 구동(브랜드 딜라이트).
 * 작은 인스턴스(xs/sm — 헤더·리스트, 상시 다수 마운트)는 정적 렌더(성능).
 *
 * mood는 API 호환용으로 유지하나 래스터 이미지라 표정은 단일(happy).
 *
 * @param {'xs' | 'sm' | 'md' | 'lg'} size
 */
export default function PickMascot({ size = 'md', className = '' }) {
  const h = SIZES[size] || SIZES.md;
  const w = Math.round(h * RATIO);
  const idle = h >= SIZES.md;

  return (
    <motion.img
      src="/mascot.png?v=pixel"
      alt=""
      aria-hidden="true"
      width={w}
      height={h}
      draggable={false}
      className={className}
      style={{ display: 'block', width: w, height: h, objectFit: 'contain', userSelect: 'none' }}
      animate={idle ? { y: [0, -5, 0], scale: [1, 1.02, 1] } : undefined}
      transition={
        idle
          ? {
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            }
          : undefined
      }
    />
  );
}
