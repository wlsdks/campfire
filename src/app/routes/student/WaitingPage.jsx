import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
import ConnectionDot from '@/components/ui/ConnectionDot';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/features/quiz/components/QuizEventBanner';
import StudentBottomBar from './StudentBottomBar';

export default function WaitingPage({ sessionId, pendingEvent = null }) {
  const { count } = useParticipants(sessionId);

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pb-32">
      {/* Connection status */}
      <div className="fixed top-4 right-4 z-10">
        <ConnectionDot />
      </div>

      <div className="text-center space-y-5">
        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto"
        >
          <Sparkles size={32} className="text-indigo-500" />
        </motion.div>

        {/* Status text */}
        <div className="space-y-1.5">
          <p className="text-slate-600 text-lg font-medium">다음 질문을 기다리는 중...</p>
          <p className="text-slate-400 text-sm">강사가 질문을 활성화하면 표시됩니다</p>
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
