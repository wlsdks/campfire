import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { hapticSuccess } from '@/lib/haptics';

// 8 particles at evenly-spaced angles
const PARTICLE_COUNT = 8;
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i * 360) / PARTICLE_COUNT);
const PARTICLE_COLORS = [
  'bg-indigo-400',
  'bg-slate-400',
  'bg-indigo-300',
  'bg-slate-300',
  'bg-indigo-500',
  'bg-slate-500',
  'bg-indigo-200',
  'bg-slate-200',
];

function ParticleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {PARTICLE_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const distance = 36 + Math.random() * 12;
        const tx = Math.cos(rad) * distance;
        const ty = Math.sin(rad) * distance;
        const size = 4 + (i % 3) * 2; // 4, 6, or 8px
        return (
          <motion.span
            key={i}
            className={`absolute rounded-full ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]}`}
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              marginTop: -(size / 2),
              marginLeft: -(size / 2),
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: tx,
              y: ty,
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.55,
              delay: 0.18 + i * 0.015,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          />
        );
      })}
    </div>
  );
}

function AnimatedCheck() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Ring pulse — expands outward and fades after check */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-slate-900 dark:border-slate-100"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.6, 1.6], opacity: [0, 0.5, 0] }}
        transition={{ delay: 0.28, duration: 0.55, ease: [0, 0.55, 0.45, 1] }}
      />

      {/* Dark circle — dramatic spring overshoot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.22, 0.92, 1.06, 1] }}
        transition={{ type: 'spring', stiffness: 420, damping: 20, duration: 0.5 }}
        className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-full"
      />

      {/* Particle burst centered on circle */}
      <ParticleBurst />

      {/* White checkmark draws in */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10 w-8 h-8"
      >
        <motion.path
          d="M6 13l4 4L18 7"
          className="stroke-white dark:stroke-slate-900"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </motion.svg>
    </div>
  );
}

export default memo(function VoteConfirm({
  submittedLabel = '투표 완료!',
  waitingLabel = '결과를 기다리는 중...',
  submittedDescription = '응답이 기록되었습니다',
  waitingDescription = '강사가 다음 단계를 진행하면 표시됩니다',
  selectedAnswer = null,
  selectedAnswerLabel = '내 응답',
}) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    hapticSuccess();
    const timer = setTimeout(() => setWaiting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl bg-white dark:bg-slate-800 px-5 py-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Check with particles */}
        <AnimatedCheck />

        {/* Label + description */}
        <div className="space-y-1 text-center">
          <motion.p
            key={waiting ? 'w' : 'd'}
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: [0.85, 1.08, 0.97, 1], y: 0 }}
            transition={{
              opacity: { duration: 0.2 },
              scale: { type: 'spring', stiffness: 380, damping: 22 },
              y: { duration: 0.2 },
            }}
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <motion.p
            key={waiting ? 'wd' : 'dd'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1"
          >
            {waiting ? waitingDescription : submittedDescription}
            {waiting && (
              <span className="flex gap-0.5 ml-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
            )}
          </motion.p>
        </div>

        {/* Selected answer pill */}
        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-xl ring-1 ring-indigo-200 dark:ring-indigo-500/30 bg-slate-50 dark:bg-slate-700/80 px-4 py-3 text-center w-full"
          >
            <p className="text-xs font-medium text-slate-400 mb-1">{selectedAnswerLabel}</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedAnswer}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
})
