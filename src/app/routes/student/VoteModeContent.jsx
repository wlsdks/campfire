import { lazy, Suspense } from 'react';
import { SuspenseFallback } from '@/components/ui/Skeleton';
import StudentHeader from './StudentHeader';
import WaitingPage from './WaitingPage';
import ActivePollView from './ActivePollView';

const LazyLeaderboardPage = lazy(() => import('./LeaderboardPage'));
const LazySessionEndedPage = lazy(() => import('./SessionEndedPage'));
const LazyClassQABoard = lazy(() => import('@/features/class-questions/components/ClassQABoard'));
const LazyFocusOverlay = lazy(() => import('@/features/session/components/FocusOverlay'));
const LazyComprehensionCheck = lazy(() => import('@/features/session/components/ComprehensionCheck'));
const LazyQuickSurvey = lazy(() => import('@/features/session/components/QuickSurvey'));
const LazyGroupDiscussion = lazy(() => import('@/features/session/components/GroupDiscussion'));

/**
 * Dispatches to the correct view for the current session mode.
 * Lazy-loads heavy pages so the initial bundle stays small.
 */
export function VoteModeContent({
  sessionId, session, status, currentMode, currentQId,
  questionProgress, timerRunning, endTime, duration,
  timerExpired, onTimerExpire,
  isSpeedQuiz, speedQuizIndex, speedQuizTotal, myStreak,
  teamActive, myTeam,
}) {
  if (status === 'ended') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazySessionEndedPage sessionId={sessionId} session={session} />
      </Suspense>
    );
  }
  if (status === 'reviewing') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazySessionEndedPage sessionId={sessionId} session={session} reviewing />
      </Suspense>
    );
  }
  if (currentMode === 'leaderboard') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazyLeaderboardPage sessionId={sessionId} />
      </Suspense>
    );
  }
  if (currentMode === 'focus') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazyFocusOverlay />
      </Suspense>
    );
  }
  if (currentMode === 'comprehension') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazyComprehensionCheck sessionId={sessionId} />
      </Suspense>
    );
  }
  if (currentMode === 'quickSurvey') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazyQuickSurvey sessionId={sessionId} />
      </Suspense>
    );
  }
  if (currentMode === 'discussion') {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LazyGroupDiscussion sessionId={sessionId} />
      </Suspense>
    );
  }
  if (currentMode === 'qaBoard') {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 px-4 pb-8 pt-16">
        <StudentHeader sessionId={sessionId} />
        <Suspense fallback={<SuspenseFallback />}>
          <LazyClassQABoard sessionId={sessionId} showInput />
        </Suspense>
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!['poll', 'quiz'].includes(currentMode) || !currentQId || !question) {
    return (
      <WaitingPage
        sessionId={sessionId}
        pendingEvent={session?.pendingEvent || null}
        courseName={session?.courseName}
        currentMode={currentMode}
      />
    );
  }

  return (
    <ActivePollView
      sessionId={sessionId}
      question={question}
      questionId={currentQId}
      questionProgress={questionProgress}
      timerRunning={timerRunning}
      endTime={endTime}
      duration={duration}
      timerExpired={timerExpired}
      onTimerExpire={onTimerExpire}
      isSpeedQuiz={isSpeedQuiz}
      speedQuizIndex={speedQuizIndex}
      speedQuizTotal={speedQuizTotal}
      myStreak={myStreak}
      teamActive={teamActive}
      myTeam={myTeam}
    />
  );
}
