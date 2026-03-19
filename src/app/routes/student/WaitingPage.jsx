import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import { getNickname } from '@/lib/participant';

const TIPS = [
  '강사가 질문을 활성화하면 자동으로 전환됩니다',
  '하단 바에서 손들기, 긴급 질문을 보낼 수 있어요',
  '채팅으로 다른 학생들과 소통해보세요',
  '퀴즈에서 빠르게 답하면 보너스 점수를 받을 수 있어요',
  '리액션으로 수업에 참여해보세요',
];

/** Pinggo mascot — round robot with blinking eyes and pulsing antenna. */
function WaitingMascot() {
  return (
    <motion.svg
      width="100"
      height="100"
      viewBox="0 0 120 120"
      fill="none"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        scale: { type: 'spring', stiffness: 260, damping: 22 },
        y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {/* Body */}
      <circle cx="60" cy="68" r="32" fill="#1E293B" />

      {/* Face highlight */}
      <ellipse cx="60" cy="62" rx="24" ry="20" fill="#334155" opacity="0.5" />

      {/* Left eye */}
      <motion.ellipse
        cx="50"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Right eye */}
      <motion.ellipse
        cx="70"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Smile */}
      <motion.path
        d="M52 76 Q60 82 68 76"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />

      {/* Antenna stick */}
      <line
        x1="60"
        y1="36"
        x2="60"
        y2="24"
        stroke="#1E293B"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Antenna ball */}
      <motion.circle
        cx="60"
        cy="21"
        r="5"
        fill="#64748B"
        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Signal wave 1 */}
      <motion.path
        d="M76 18 Q82 10 76 2"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: [0, 0.5, 0], pathLength: [0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Signal wave 2 */}
      <motion.path
        d="M84 22 Q92 10 84 -2"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: [0, 0.3, 0], pathLength: [0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
      />
    </motion.svg>
  );
}

/** Rotating tips with crossfade animation. */
function RotatingTip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-10 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-slate-400 text-sm text-center absolute px-4"
        >
          {TIPS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function WaitingPage({ sessionId, pendingEvent = null }) {
  const { count } = useParticipants(sessionId);
  const nickname = getNickname();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center w-full max-w-xs space-y-6"
      >
        {/* Mascot */}
        <div className="flex justify-center">
          <WaitingMascot />
        </div>

        {/* Greeting + Status */}
        <div className="space-y-2">
          {nickname && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
              className="text-slate-900 text-xl font-bold"
            >
              {nickname}님, 준비 완료!
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
            className="text-slate-500 text-base"
          >
            다음 질문을 기다리는 중...
          </motion.p>
        </div>

        {/* Participant count */}
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center gap-2"
          >
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-sm">
              <Users size={16} className="text-slate-400" />
              <span className="text-slate-700 text-sm font-medium">
                <span className="text-slate-900 text-lg font-bold tabular-nums">{count}</span>
                <span className="ml-0.5">명 참여 중</span>
              </span>
            </div>
          </motion.div>
        )}

        {/* Session code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <Badge variant="neutral">{sessionId}</Badge>
        </motion.div>

        {/* Rotating tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <RotatingTip />
        </motion.div>

        {/* Quiz event banner */}
        {pendingEvent && (
          <div className="pt-1 max-w-sm mx-auto">
            <QuizEventBanner event={pendingEvent} state="pending" />
          </div>
        )}
      </motion.div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
