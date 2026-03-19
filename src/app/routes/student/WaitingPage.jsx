import { motion } from 'framer-motion';
import { Radio, Users } from 'lucide-react';
import { useState } from 'react';
import Lottie from 'lottie-react';
import ConnectionDot from '@/components/ui/ConnectionDot';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentBottomBar from './StudentBottomBar';

/** Inline Lottie JSON: 3 dots that pulse in sequence like a typing indicator. */
const pulsingDotsData = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 60, h: 16,
  layers: [0, 1, 2].map((i) => ({
    ty: 4, ip: 0, op: 60, st: 0,
    ks: {
      p: { a: 0, k: [12 + i * 18, 8, 0] },
      s: { a: 1, k: [
        { t: i * 6, s: [100, 100, 100], e: [140, 140, 100], i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] } },
        { t: i * 6 + 10, s: [140, 140, 100], e: [100, 100, 100], i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] } },
        { t: i * 6 + 20, s: [100, 100, 100] },
      ] },
      o: { a: 1, k: [
        { t: i * 6, s: [50], e: [100] },
        { t: i * 6 + 10, s: [100], e: [50] },
        { t: i * 6 + 20, s: [50] },
      ] },
      r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
    },
    shapes: [{
      ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [6, 6] },
    }, {
      ty: 'fl', c: { a: 0, k: [0.58, 0.55, 0.86, 1] }, o: { a: 0, k: 100 },
    }],
  })),
};

/** 3 pulsing dots indicator with Lottie, falls back to CSS. */
function PulsingDots() {
  const [hasLottie, setHasLottie] = useState(true);

  if (!hasLottie) {
    return (
      <div className="flex items-center gap-1.5 justify-center pt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-300"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-2">
      <div className="w-[60px] h-4">
        <Lottie
          animationData={pulsingDotsData}
          loop
          autoplay
          onError={() => setHasLottie(false)}
        />
      </div>
    </div>
  );
}

export default function WaitingPage({ sessionId, pendingEvent = null }) {
  const { count } = useParticipants(sessionId);

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pb-32">
      {/* Connection status */}
      <div className="fixed top-4 right-4 z-10">
        <ConnectionDot />
      </div>

      <div className="text-center space-y-5">
        {/* Broadcasting icon with sonar ring */}
        <div className="relative w-16 h-16 mx-auto">
          {/* Sonar ping ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-indigo-300"
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
          />
          {/* Second ring, offset timing */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-indigo-300"
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 1.25 }}
          />
          {/* Icon container */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center relative z-10"
          >
            <Radio size={32} className="text-indigo-500" />
          </motion.div>
        </div>

        {/* Status text */}
        <div className="space-y-1.5">
          <p className="text-slate-600 text-lg font-medium">다음 질문을 기다리는 중...</p>
          <p className="text-slate-400 text-sm">강사가 질문을 활성화하면 표시됩니다</p>
          <PulsingDots />
        </div>

        {/* Info badges */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {count > 0 && (
            <Badge variant="primary">
              <Users size={12} className="mr-1" />
              {count}명 참여 중
            </Badge>
          )}
          <Badge variant="neutral">{sessionId}</Badge>
        </div>

        {pendingEvent && (
          <div className="pt-2 max-w-sm mx-auto">
            <QuizEventBanner event={pendingEvent} state="pending" />
          </div>
        )}
      </div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
