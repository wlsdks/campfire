import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyVote } from '@/hooks/useMyVote';
import ChoiceVoter from '@/features/voting/components/ChoiceVoter';
import OXVoter from '@/features/voting/components/OXVoter';
import QuizVoter from '@/features/voting/components/QuizVoter';
import TextInput from '@/features/voting/components/TextInput';
import ScaleVoter from '@/features/voting/components/ScaleVoter';
import DebateVoter from '@/features/voting/components/DebateVoter';
import RankingVoter from '@/features/voting/components/RankingVoter';
import FillBlankVoter from '@/features/voting/components/FillBlankVoter';
import CheckVoter from '@/features/voting/components/CheckVoter';
import MysteryBoxVoter from '@/features/voting/components/MysteryBoxVoter';
import HintQuizVoter from '@/features/voting/components/HintQuizVoter';
import CorrectAnswerRanking from '@/features/visualization/components/CorrectAnswerRanking';
import ImageSlidePresenter from '@/features/visualization/components/ImageSlidePresenter';
import { getParticipantId } from '@/lib/participant';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import QuestionCard from './QuestionCard';
import ReviewingBanner from '@/components/ui/ReviewingBanner';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import TimerCountdown from '@/features/timer/components/TimerCountdown';
import SpeedQuizBanner from '@/features/quiz/components/SpeedQuizBanner';
import SpeedQuizCombo from '@/features/quiz/components/SpeedQuizCombo';
import StreakBadge from '@/features/quiz/components/StreakBadge';
import TeamBadge from '@/features/teams/components/TeamBadge';
import { QuizResultFromVote, TimerExpiredOverlay } from './VoteHelpers';

/**
 * 활성 투표/퀴즈 뷰 — 질문 카드 + 타이머 + 투표 영역
 */
export default memo(function ActivePollView({
  sessionId,
  question,
  questionId,
  questionProgress,
  // Timer
  timerRunning,
  endTime,
  duration,
  timerExpired,
  onTimerExpire,
  // Quiz / speed quiz
  isSpeedQuiz,
  speedQuizIndex,
  speedQuizTotal,
  myStreak,
  // Team
  teamActive,
  myTeam,
}) {
  const { myVote } = useMyVote(sessionId, questionId);
  const hasVoted = !!myVote;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center px-5 pb-40 pt-20 overflow-y-auto">
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
          <TeamBadge
            teamName={myTeam.name}
            teamColors={myTeam.colors}
            memberCount={myTeam.memberCount}
          />
        )}

        {/* Streak badge — shown on regular quiz (non-speed) when 3+ streak */}
        {!isSpeedQuiz && question?.type === 'quiz' && myStreak >= 3 && (
          <StreakBadge streak={myStreak} />
        )}

        {/* Question title card */}
        <QuestionCard
          question={question}
          questionId={questionId}
          questionProgress={questionProgress}
        />

        {/* Timer countdown bar */}
        <AnimatePresence>
          {timerRunning && (
            <TimerCountdown
              endTime={endTime}
              duration={duration}
              onExpire={onTimerExpire}
            />
          )}
        </AnimatePresence>

        {question.type === 'quiz' && question.event && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.04 }}
          >
            <QuizEventBanner
              event={question.event}
              state={question.revealedAt ? 'result' : 'active'}
            />
          </motion.div>
        )}

        {/* Voter area */}
        <ErrorBoundary scope="voter" fullPage={false}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`voter-${questionId}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.08 }}
              className="relative"
            >
              {question.type === 'choice' && (
                <ChoiceVoter sessionId={sessionId} questionId={questionId} options={question.options || []} disabled={timerExpired} />
              )}
              {question.type === 'quiz' && (
                <QuizVoter
                  sessionId={sessionId}
                  questionId={questionId}
                  question={question}
                  disabled={timerExpired}
                  renderResult={(currentVote) => (
                    <QuizResultFromVote question={question} currentVote={currentVote} streak={myStreak} />
                  )}
                />
              )}
              {question.type === 'ox' && (
                <OXVoter sessionId={sessionId} questionId={questionId} disabled={timerExpired} />
              )}
              {question.type === 'wordcloud' && (
                <TextInput sessionId={sessionId} questionId={questionId} type="wordcloud" placeholder="단어를 입력하세요" maxLength={20} disabled={timerExpired} />
              )}
              {question.type === 'qna' && (
                <TextInput sessionId={sessionId} questionId={questionId} type="qna" placeholder="질문을 입력하세요" maxLength={200} disabled={timerExpired} />
              )}
              {question.type === 'scale' && (
                <ScaleVoter sessionId={sessionId} questionId={questionId} disabled={timerExpired} />
              )}
              {question.type === 'debate' && (
                <DebateVoter sessionId={sessionId} questionId={questionId} disabled={timerExpired} />
              )}
              {question.type === 'ranking' && (
                <RankingVoter sessionId={sessionId} questionId={questionId} options={question.options || []} disabled={timerExpired} />
              )}
              {question.type === 'fillinblank' && (
                <FillBlankVoter
                  sessionId={sessionId}
                  questionId={questionId}
                  title={question.title}
                  correctAnswer={question.correctAnswer}
                  disabled={timerExpired}
                />
              )}
              {question.type === 'check' && (
                <CheckVoter sessionId={sessionId} questionId={questionId} disabled={timerExpired} />
              )}
              {question.type === 'imageSlide' && (
                <ImageSlidePresenter images={question.slideImages || []} currentSlide={question.currentSlide || 0} />
              )}
              {question.type === 'mysteryBox' && (
                <>
                  <MysteryBoxVoter sessionId={sessionId} questionId={questionId} disabled={timerExpired} />
                  {question.revealedAt && (
                    <CorrectAnswerRanking
                      sessionId={sessionId}
                      questionId={questionId}
                      correctAnswer={question.correctAnswer}
                      myParticipantId={getParticipantId()}
                    />
                  )}
                </>
              )}
              {question.type === 'hintQuiz' && (
                <>
                  <HintQuizVoter
                    sessionId={sessionId}
                    questionId={questionId}
                    hints={question.hints || []}
                    revealedHints={question.revealedHints || 0}
                    disabled={timerExpired}
                  />
                  {question.revealedAt && (
                    <CorrectAnswerRanking
                      sessionId={sessionId}
                      questionId={questionId}
                      correctAnswer={question.correctAnswer}
                      acceptableAnswers={question.acceptableAnswers}
                      myParticipantId={getParticipantId()}
                    />
                  )}
                </>
              )}

              {/* Time's up overlay — only show if student hasn't voted yet */}
              <AnimatePresence>
                {timerExpired && !hasVoted && <TimerExpiredOverlay />}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      <ReviewingBanner sessionId={sessionId} />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
});
