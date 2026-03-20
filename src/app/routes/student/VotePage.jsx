import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSession } from '@/features/session/api/useSession';
import ChoiceVoter from '@/features/voting/components/ChoiceVoter';
import OXVoter from '@/features/voting/components/OXVoter';
import QuizVoter from '@/features/voting/components/QuizVoter';
import TextInput from '@/features/voting/components/TextInput';
import ScaleVoter from '@/features/voting/components/ScaleVoter';
import DebateVoter from '@/features/voting/components/DebateVoter';
import WaitingPage from './WaitingPage';
import LeaderboardPage from './LeaderboardPage';
import SessionEndedPage from './SessionEndedPage';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import Badge from '@/components/ui/Badge';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import QuizResult from '@/features/quiz/components/QuizResult';
import { SkeletonCard } from '@/components/ui/Skeleton';
import TimerCountdown from '@/features/timer/components/TimerCountdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import { getQuizReward } from '@/lib/quiz';

const TYPE_LABELS = {
  choice: '객관식',
  ox: 'O/X',
  quiz: '퀴즈',
  wordcloud: '워드클라우드',
  qna: 'Q&A',
  scale: '감정 온도계',
  debate: '찬반 토론',
};

/** Renders QuizResult from vote data passed by QuizVoter. */
function QuizResultFromVote({ question, currentVote }) {
  if (!currentVote) return null;
  const reward = getQuizReward(question, currentVote);
  return (
    <QuizResult
      isCorrect={reward.isCorrect}
      points={reward.points}
      tickets={reward.tickets}
      correctAnswer={question.correctAnswer}
      event={question.event || null}
    />
  );
}

/** Timer expired overlay shown when countdown reaches zero. */
function TimerExpiredOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-2"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center"
      >
        <Clock size={22} className="text-white" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold text-slate-900"
      >
        시간이 종료되었습니다
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-400"
      >
        결과를 기다려주세요
      </motion.p>
    </motion.div>
  );
}

export default function VotePage({ sessionId }) {
  const { session, loading } = useSession(sessionId);
  const { isRunning: timerRunning, endTime, duration } = useTimer(sessionId);
  const [timerExpired, setTimerExpired] = useState(false);

  const handleTimerExpire = useCallback(() => {
    setTimerExpired(true);
  }, []);

  // Reset timerExpired when question changes or timer restarts
  const prevQuestionRef = useRef(session?.currentQuestion);
  const prevEndTimeRef = useRef(endTime);
  useEffect(() => {
    const currentQId = session?.currentQuestion;
    if (currentQId !== prevQuestionRef.current || (endTime && endTime !== prevEndTimeRef.current)) {
      setTimerExpired(false);
    }
    prevQuestionRef.current = currentQId;
    prevEndTimeRef.current = endTime;
  }, [session?.currentQuestion, endTime]);

  // Compute question progress: "질문 1/3"
  // Must be before all conditional returns to satisfy React hooks rules.
  const questionProgress = useMemo(() => {
    const currentQId = session?.currentQuestion;
    const questions = session?.questions || {};
    const sorted = Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const total = sorted.length;
    if (total === 0 || !currentQId) return null;
    const idx = sorted.findIndex(([qId]) => qId === currentQId);
    return idx >= 0 ? { current: idx + 1, total } : null;
  }, [session?.questions, session?.currentQuestion]);

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

  // Show summary card when session is ended
  if (session?.status === 'ended') {
    return <SessionEndedPage sessionId={sessionId} session={session} />;
  }

  if (currentMode === 'leaderboard') return <LeaderboardPage sessionId={sessionId} />;
  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    return <WaitingPage sessionId={sessionId} pendingEvent={session?.pendingEvent || null} />;
  }

  const question = session?.questions?.[currentQId];

  if (!question) return <WaitingPage sessionId={sessionId} pendingEvent={session?.pendingEvent || null} />;

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 pb-36 pt-16">
      <StudentHeader sessionId={sessionId} />

      <div className="w-full max-w-sm space-y-4">
          {/* Question header */}
          <motion.div
            key={`header-${currentQId}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
          >
            {questionProgress && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">
                  질문 {questionProgress.current}/{questionProgress.total}
                </span>
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-300 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 leading-snug flex-1">
                {question.title}
              </h2>
              <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
            </div>
          </motion.div>

          {/* Timer countdown bar */}
          <AnimatePresence>
            {timerRunning && (
              <TimerCountdown
                endTime={endTime}
                duration={duration}
                onExpire={handleTimerExpire}
              />
            )}
          </AnimatePresence>

          {question.type === 'quiz' && question.event && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.04 }}
            >
              <QuizEventBanner event={question.event} state={question.revealedAt ? 'result' : 'active'} />
            </motion.div>
          )}

          {/* Voter area */}
          <ErrorBoundary scope="voter" fullPage={false}>
            <motion.div
              key={`voter-${currentQId}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.08 }}
              className="relative"
            >
              {question.type === 'choice' && (
                <ChoiceVoter sessionId={sessionId} questionId={currentQId} options={question.options || []} disabled={timerExpired} />
              )}
              {question.type === 'quiz' && (
                <QuizVoter
                  sessionId={sessionId}
                  questionId={currentQId}
                  question={question}
                  disabled={timerExpired}
                  renderResult={(currentVote) => (
                    <QuizResultFromVote question={question} currentVote={currentVote} />
                  )}
                />
              )}
              {question.type === 'ox' && (
                <OXVoter sessionId={sessionId} questionId={currentQId} disabled={timerExpired} />
              )}
              {question.type === 'wordcloud' && (
                <TextInput sessionId={sessionId} questionId={currentQId} type="wordcloud" placeholder="단어를 입력하세요" maxLength={20} disabled={timerExpired} />
              )}
              {question.type === 'qna' && (
                <TextInput sessionId={sessionId} questionId={currentQId} type="qna" placeholder="질문을 입력하세요" maxLength={200} disabled={timerExpired} />
              )}
              {question.type === 'scale' && (
                <ScaleVoter sessionId={sessionId} questionId={currentQId} disabled={timerExpired} />
              )}
              {question.type === 'debate' && (
                <DebateVoter sessionId={sessionId} questionId={currentQId} disabled={timerExpired} />
              )}

              {/* Time's up overlay */}
              <AnimatePresence>
                {timerExpired && <TimerExpiredOverlay />}
              </AnimatePresence>
            </motion.div>
          </ErrorBoundary>
      </div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
