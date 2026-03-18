import { useSession } from '@/features/session/api/useSession';
import ChoiceVoter from '@/features/voting/components/ChoiceVoter';
import OXVoter from '@/features/voting/components/OXVoter';
import TextInput from '@/features/voting/components/TextInput';
import WaitingPage from './WaitingPage';
import ConnectionDot from '@/components/ui/ConnectionDot';
import StudentBottomBar from './StudentBottomBar';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import TimerRing from '@/features/timer/components/TimerRing';

const TYPE_LABELS = {
  choice: '객관식',
  ox: 'O/X',
  wordcloud: '워드클라우드',
  qna: 'Q&A',
};

export default function VotePage({ sessionId }) {
  const { session, loading } = useSession(sessionId);
  const { isRunning: timerRunning, endTime, duration } = useTimer(sessionId);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">불러오는 중...</span>
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (currentMode !== 'poll' || !currentQId) return <WaitingPage sessionId={sessionId} />;

  const question = session?.questions?.[currentQId];
  if (!question) return <WaitingPage sessionId={sessionId} />;

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center p-4 pb-32">
      {/* Connection status */}
      <div className="fixed top-4 right-4 z-10">
        <ConnectionDot />
      </div>

      <div className="w-full max-w-sm space-y-6 mt-4">
        {/* Question header */}
        <motion.div
          key={currentQId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 leading-snug flex-1">
              {question.title}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              {timerRunning && <TimerRing endTime={endTime} duration={duration} size="sm" />}
              <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
            </div>
          </div>
        </motion.div>

        {/* Voter area */}
        <motion.div
          key={`voter-${currentQId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
        >
          {question.type === 'choice' && (
            <ChoiceVoter sessionId={sessionId} questionId={currentQId} options={question.options || []} />
          )}
          {question.type === 'ox' && (
            <OXVoter sessionId={sessionId} questionId={currentQId} />
          )}
          {question.type === 'wordcloud' && (
            <TextInput sessionId={sessionId} questionId={currentQId} placeholder="단어를 입력하세요" maxLength={20} />
          )}
          {question.type === 'qna' && (
            <TextInput sessionId={sessionId} questionId={currentQId} placeholder="질문을 입력하세요" maxLength={200} />
          )}
        </motion.div>
      </div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
