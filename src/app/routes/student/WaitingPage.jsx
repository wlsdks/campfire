import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import IdleMascot from './IdleMascot';
import { getNickname } from '@/lib/participant';

const TIPS = [
  '강사가 질문을 활성화하면 자동으로 전환됩니다',
  '하단 바에서 손들기, 긴급 질문을 보낼 수 있어요',
  '채팅으로 다른 학생들과 소통해보세요',
  '퀴즈에서 빠르게 답하면 보너스 점수를 받을 수 있어요',
  '리액션으로 수업에 참여해보세요',
];

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
          className="text-slate-500 dark:text-slate-400 text-sm text-center absolute px-4"
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
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center w-full max-w-xs space-y-6"
      >
        {/* Mascot with idle animations */}
        <div className="flex justify-center">
          <IdleMascot />
        </div>

        {/* Greeting + Status */}
        <div className="space-y-2">
          {nickname && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
              className="text-slate-900 dark:text-slate-100 text-xl font-bold"
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
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <Users size={16} className="text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                <span className="text-slate-900 dark:text-slate-100 text-lg font-bold tabular-nums">{count}</span>
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
          <div className="pt-1 max-w-xl mx-auto">
            <QuizEventBanner event={pendingEvent} state="pending" />
          </div>
        )}
      </motion.div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
