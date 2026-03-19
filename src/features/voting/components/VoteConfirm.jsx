import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Lottie from 'lottie-react';

const checkmarkData = {
  v: '5.7.4', fr: 60, ip: 0, op: 50, w: 100, h: 100,
  layers: [
    {
      ty: 4, ip: 0, op: 50, st: 0,
      ks: {
        p: { a: 0, k: [50, 50] }, a: { a: 0, k: [0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [0, 0], e: [107, 107] },
          { t: 14, s: [107, 107], e: [100, 100] },
          { t: 20, s: [100, 100] },
        ] },
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      },
      shapes: [
        { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [66, 66] } },
        { ty: 'fl', c: { a: 0, k: [0.06, 0.09, 0.16, 1] } },
      ],
    },
    {
      ty: 4, ip: 14, op: 50, st: 0,
      ks: {
        p: { a: 0, k: [50, 52] }, a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] }, o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      },
      shapes: [
        {
          ty: 'sh', ks: { a: 0, k: {
            c: false, v: [[-12, 0], [-4, 9], [14, -10]],
            i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]],
          } },
        },
        {
          ty: 'st', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 },
          w: { a: 0, k: 3.5 }, lc: 2, lj: 2,
          d: [
            { n: 'd', nm: 'dash', v: { a: 0, k: 46 } },
            { n: 'o', nm: 'offset', v: { a: 1, k: [
              { t: 14, s: [46], e: [0] },
              { t: 30, s: [0] },
            ] } },
          ],
        },
      ],
    },
  ],
};

function CheckIcon() {
  const [useLottie, setUseLottie] = useState(true);

  if (!useLottie) {
    return <Check size={32} className="text-slate-800" strokeWidth={2.5} />;
  }

  return (
    <div className="w-12 h-12">
      <Lottie
        animationData={checkmarkData}
        loop={false}
        autoplay
        onError={() => setUseLottie(false)}
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
    const timer = setTimeout(() => setWaiting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
        >
          <CheckIcon />
        </motion.div>

        <div className="space-y-1 text-center">
          <motion.p
            key={waiting ? 'w' : 'd'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-slate-900"
          >
            {waiting ? waitingLabel : submittedLabel}
          </motion.p>
          <p className="text-sm text-slate-400">
            {waiting ? waitingDescription : submittedDescription}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
