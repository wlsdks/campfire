import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';

/** Animated number counter — counts from prev to `value` on change. */
export default function AnimatedScore({ value, suffix = '점' }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const displayRef = useRef(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const from = prevValueRef.current;
    prevValueRef.current = value;

    const unsubscribe = rounded.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = `${v}${suffix}`;
    });
    const controls = animate(motionVal, value, {
      from,
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded, suffix]);

  return <span ref={displayRef} className="tabular-nums">{value}{suffix}</span>;
}
