import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense, memo } from 'react';
import { useSession } from '@/features/session/api/useSession';
import ChoiceVoter from '@/features/voting/components/ChoiceVoter';
import OXVoter from '@/features/voting/components/OXVoter';
import QuizVoter from '@/features/voting/components/QuizVoter';
import TextInput from '@/features/voting/components/TextInput';
import ScaleVoter from '@/features/voting/components/ScaleVoter';
import DebateVoter from '@/features/voting/components/DebateVoter';
import RankingVoter from '@/features/voting/components/RankingVoter';
import FillBlankVoter from '@/features/voting/components/FillBlankVoter';
import WaitingPage from './WaitingPage';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';

const LeaderboardPage = lazy(() => import('./LeaderboardPage'));
const SessionEndedPage = lazy(() => import('./SessionEndedPage'));
const ClassQABoard = lazy(() => import('@/features/class-questions/components/ClassQABoard'));
const FocusOverlay = lazy(() => import('@/features/session/components/FocusOverlay'));
import { QuizResultFromVote, TimerExpiredOverlay } from './VoteHelpers';
import { TYPE_LABELS } from '@/lib/question-types';
import Badge from '@/components/ui/Badge';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { SuspenseFallback, VotePageSkeleton } from '@/components/ui/Skeleton';
import TimerCountdown from '@/features/timer/components/TimerCountdown';
import { motion, AnimatePresence } from 'framer-motion';

import { useTimer } from '@/features/timer/api/useTimer';
import { useScores } from '@/features/quiz/api/useScores';
import { useAchievements } from '@/features/quiz/api/useAchievements';
import { useSpeedQuizStudent } from '@/features/quiz/api/useSpeedQuizStudent';
import AchievementToast from '@/features/quiz/components/AchievementToast';
import SpeedQuizBanner from '@/features/quiz/components/SpeedQuizBanner';
import SpeedQuizCombo from '@/features/quiz/components/SpeedQuizCombo';
import StreakBadge from '@/features/quiz/components/StreakBadge';
import TeamBadge from '@/features/teams/components/TeamBadge';
import { useMyTeam } from '@/features/teams/api/useTeamBattle';
import { getParticipantId } from '@/lib/participant';
import { useQuestionChime } from '@/hooks/useQuestionChime';
import ReviewingBanner from '@/components/ui/ReviewingBanner';

export default memo(function VotePage({ sessionId }) {
  const { session, loading } = useSession(sessionId);
  const { isRunning: timerRunning, endTime, duration } = useTimer(sessionId);
  const [timerExpired, setTimerExpired] = useState(false);

  // Play chime when a new question activates
  useQuestionChime(session?.currentQuestion);

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

  // Achievement system — computed from existing votes/scores
  const { scores } = useScores(sessionId);
  const { achievements } = useAchievements(session, scores);

  // Speed quiz mode detection
  const { isSpeedQuiz, totalQuestions: speedQuizTotal } = useSpeedQuizStudent(sessionId);
  const participantId = getParticipantId();
  const myStreak = scores[participantId]?.streak || 0;

  // Team battle
  const { isActive: teamActive, myTeam } = useMyTeam(sessionId, participantId);

  // Compute current quiz question index for speed quiz banner
  const speedQuizIndex = useMemo(() => {
    if (!isSpeedQuiz) return 0;
    const currentQId = session?.currentQuestion;
    const questions = session?.questions || {};
    const quizQs = Object.entries(questions)
      .filter(([, q]) => q.type === 'quiz')
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const idx = currentQId ? quizQs.findIndex(([qId]) => qId === currentQId) : -1;
    return idx >= 0 ? idx + 1 : 0;
  }, [isSpeedQuiz, session?.currentQuestion, session?.questions]);

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
    return <VotePageSkeleton />;
  }

  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  // Show summary card when session is ended
  if (session?.status === 'ended') {
    return <Suspense fallback={<SuspenseFallback />}><SessionEndedPage sessionId={sessionId} session={session} /></Suspense>;
  }

  // Reviewing: show summary + keep bottom bar for questions/chat
  if (session?.status === 'reviewing') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <SessionEndedPage sessionId={sessionId} session={session} reviewing />
      </Suspense>
    );
  }

  if (currentMode === 'leaderboard') return <Suspense fallback={<SuspenseFallback />}><LeaderboardPage sessionId={sessionId} /></Suspense>;
  if (currentMode === 'focus') return <Suspense fallback={<SuspenseFallback />}><FocusOverlay /></Suspense>;
  if (currentMode === 'qaBoard') {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 px-4 pb-8 pt-16">
        <StudentHeader sessionId={sessionId} />
        <Suspense fallback={<SuspenseFallback />}>
          <ClassQABoard sessionId={sessionId} showInput />
        </Suspense>
      </div>
    );
  }
  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    return <WaitingPage sessionId={sessionId} pendingEvent={session?.pendingEvent || null} courseName={session?.courseName} currentMode={currentMode} />;
  }

  const question = session?.questions?.[currentQId];

  if (!question) return <WaitingPage sessionId={sessionId} pendingEvent={session?.pendingEvent || null} courseName={session?.courseName} currentMode={currentMode} />;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-5 pb-40 pt-16">
      <StudentHeader sessionId={sessionId} />

      <div className="w-full max-w-xl space-y-5">
          {/* Speed quiz banner */}
          {isSpeedQuiz && question?.type === 'quiz' && (
            <SpeedQuizBanner
              currentIndex={speedQuizIndex}
              totalQuestions={speedQuizTotal}
            />
          )}

          {/* Speed quiz combo counter */}
          {isSpeedQuiz && question?.type === 'quiz' && myStreak >= 1 && (
            <SpeedQuizCombo streak={myStreak} />
          )}

          {/* Team badge */}
          {teamActive && myTeam && (
            <TeamBadge teamName={myTeam.name} teamColors={myTeam.colors} memberCount={myTeam.memberCount} />
          )}

          {/* Streak badge — shown on regular quiz (non-speed) when 3+ streak */}
          {!isSpeedQuiz && question?.type === 'quiz' && myStreak >= 3 && (
            <StreakBadge streak={myStreak} />
          )}

          {/* Question header */}
          <motion.div
            key={`header-${currentQId}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            {questionProgress && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                  질문 <motion.span key={questionProgress.current} initial={{ scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="inline-block">{questionProgress.current}</motion.span>/{questionProgress.total}
                </span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight flex-1">
                {question.title}
              </h2>
              <div className="flex items-center gap-1.5 shrink-0">
                {question.type === 'quiz' && question.betting && (
                  <Badge variant="neutral">베팅</Badge>
                )}
                <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
              </div>
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.04 }}
            >
              <QuizEventBanner event={question.event} state={question.revealedAt ? 'result' : 'active'} />
            </motion.div>
          )}

          {/* Voter area */}
          <ErrorBoundary scope="voter" fullPage={false}>
           <AnimatePresence mode="wait">
            <motion.div
              key={`voter-${currentQId}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.08 }}
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
                    <QuizResultFromVote question={question} currentVote={currentVote} streak={myStreak} />
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
              {question.type === 'ranking' && (
                <RankingVoter sessionId={sessionId} questionId={currentQId} options={question.options || []} disabled={timerExpired} />
              )}
              {question.type === 'fillinblank' && (
                <FillBlankVoter
                  sessionId={sessionId}
                  questionId={currentQId}
                  title={question.title}
                  correctAnswer={question.correctAnswer}
                  disabled={timerExpired}
                />
              )}

              {/* Time's up overlay */}
              <AnimatePresence>
                {timerExpired && <TimerExpiredOverlay />}
              </AnimatePresence>
            </motion.div>
           </AnimatePresence>
          </ErrorBoundary>
      </div>

      <ReviewingBanner sessionId={sessionId} />
      <StudentBottomBar sessionId={sessionId} />
      <AchievementToast achievements={achievements} />
    </div>
  );
});
