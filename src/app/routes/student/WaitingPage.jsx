import { motion } from 'framer-motion';
import { Radio, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import { getNickname } from '@/lib/participant';

function PulsingDots() {
  return (
    <div className="flex items-center gap-2 justify-center pt-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-300"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function WaitingPage({ sessionId, pendingEvent = null }) {
  const { count } = useParticipants(sessionId);
  const nickname = getNickname();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />

      <div className="text-center space-y-5">
        {/* Broadcasting icon with sonar ring */}
        <div className="relative w-12 h-12 mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full border border-indigo-200"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-indigo-200"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 1.25 }}
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-12 h-12 flex items-center justify-center relative z-10"
          >
            <Radio size={28} className="text-indigo-500" />
          </motion.div>
        </div>

        {/* Greeting + Status text */}
        <div className="space-y-1.5">
          {nickname && (
            <p className="text-slate-900 text-xl font-bold">안녕하세요, {nickname}님!</p>
          )}
          <p className="text-slate-500 text-base">다음 질문을 기다리는 중...</p>
          <p className="text-slate-400 text-sm">강사가 질문을 활성화하면 표시됩니다</p>
          <PulsingDots />
        </div>

        {/* Info badges */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {count > 0 && (
            <Badge variant="neutral">
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
