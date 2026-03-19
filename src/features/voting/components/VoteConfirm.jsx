import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check, Clock } from 'lucide-react';
import Lottie from 'lottie-react';

/** Inline Lottie JSON: circle draws itself, then checkmark draws inside. */
const checkmarkData = {
  v: '5.7.4', fr: 30, ip: 0, op: 40, w: 100, h: 100,
  layers: [
    {
      ty: 4, ip: 0, op: 40, st: 0,
      ks: {
        p: { a: 0, k: [50, 50, 0] }, s: { a: 0, k: [100, 100, 100] },
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
      },
      shapes: [
        {
          ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [72, 72] },
        },
        {
          ty: 'st', c: { a: 0, k: [0.31, 0.27, 0.9, 1] }, o: { a: 0, k: 100 },
          w: { a: 0, k: 3 }, lc: 2, lj: 2,
          d: [{ n: 'd', nm: 'dash', v: { a: 0, k: 226 } }, { n: 'o', nm: 'offset', v: { a: 1, k: [
            { t: 0, s: [226], e: [0] },
            { t: 20, s: [0] },
          ] } }],
        },
      ],
    },
    {
      ty: 4, ip: 12, op: 40, st: 0,
      ks: {
        p: { a: 0, k: [50, 50, 0] }, s: { a: 0, k: [100, 100, 100] },
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
      },
      shapes: [
        {
          ty: 'sh', ks: { a: 0, k: {
            c: false, v: [[-16, 2], [-6, 12], [18, -12]],
            i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]],
          } },
        },
        {
          ty: 'st', c: { a: 0, k: [0.31, 0.27, 0.9, 1] }, o: { a: 0, k: 100 },
          w: { a: 0, k: 4 }, lc: 2, lj: 2,
          d: [{ n: 'd', nm: 'dash', v: { a: 0, k: 60 } }, { n: 'o', nm: 'offset', v: { a: 1, k: [
            { t: 12, s: [60], e: [0] },
            { t: 30, s: [0] },
          ] } }],
        },
      ],
    },
  ],
};

/** Lottie checkmark with SVG fallback. */
function LottieCheckmark() {
  const [hasLottie, setHasLottie] = useState(true);

  if (!hasLottie) {
    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </motion.svg>
    );
  }

  return (
    <div className="w-10 h-10">
      <Lottie
        animationData={checkmarkData}
        loop={false}
        autoplay
        onError={() => setHasLottie(false)}
      />
    </div>
  );
}

export default function VoteConfirm({
  submittedLabel = '투표 완료!',
  waitingLabel = '결과를 기다리는 중...',
  submittedDescription = '응답이 기록되었습니다',
  waitingDescription = '강사가 다음 단계를 진행하면 표시됩니다',
}) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaiting(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm"
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="flex h-14 w-14 items-center justify-center"
        >
          <LottieCheckmark />
        </motion.div>

        <div className="space-y-1.5 text-center">
          <motion.p
            key={waiting ? 'waiting' : 'done'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-slate-900"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <p className="text-sm text-slate-500">
            {waiting ? '잠시 후 강사가 다음 단계를 진행하면 상태가 바뀝니다.' : submittedDescription}
          </p>
        </div>

        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className="text-xs font-medium text-slate-400">현재 상태</p>
          <p className="mt-1 text-sm text-slate-600">
            {waiting ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                {waitingDescription}
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                응답이 정상적으로 기록되었습니다
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
