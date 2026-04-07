import { memo, useMemo } from 'react';
import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';
import ScaleChart from './ScaleChart';
import DebateChart from './DebateChart';
import RankingChart from './RankingChart';
import FillBlankChart from './FillBlankChart';
import CheckProgress from './CheckProgress';
import TextAnswerChart from './TextAnswerChart';
import MysteryBoxPresenter from './MysteryBoxPresenter';
import HintQuizPresenter from './HintQuizPresenter';
import CorrectAnswerRanking from './CorrectAnswerRanking';
import ImageSlidePresenter from './ImageSlidePresenter';
import BetDistribution from './BetDistribution';
import ConfidenceStats from './ConfidenceStats';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import { isQuizQuestion } from '@/lib/quiz';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useCallback, lazy, Suspense, useState, useEffect } from 'react';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));
import { TYPE_LABELS } from '@/lib/question-types';

export default memo(function VizRenderer({ sessionId, session, isAdmin = false }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;
  const currentQuestion = session?.questions?.[currentQId];
  const options = useMemo(() => currentQuestion?.options || [], [currentQuestion?.options]);

  // 폭죽 3연발 (0.5초 간격)
  const [confettiKey, setConfettiKey] = useState(0);
  const revealedAt = currentQuestion?.revealedAt;
  useEffect(() => {
    if (!revealedAt) { setConfettiKey(0); return; }
    setConfettiKey(1);
    const t2 = setTimeout(() => setConfettiKey(2), 500);
    const t3 = setTimeout(() => setConfettiKey(3), 1000);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [revealedAt]);

  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    const hasQuestions = session?.questions && Object.keys(session.questions).length > 0;
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title={hasQuestions ? '질문이 준비되어 있습니다' : '아직 질문이 없습니다'}
          description={hasQuestions
            ? '질문 목록에서 질문을 활성화하면 여기에 실시간 결과가 표시됩니다'
            : '+ 추가 버튼으로 첫 질문을 만들어보세요'}
          steps={hasQuestions
            ? ['질문 목록에서 질문을 선택하세요', '재생 버튼으로 활성화하세요', '학생 응답이 실시간으로 나타납니다']
            : ['+ 추가 버튼으로 질문을 만드세요', '객관식, O/X, 워드클라우드 등 선택', '질문을 활성화하면 수업이 시작됩니다']}
          mascotSize="lg"
          mood="waiting"
          className="py-8"
        />
      </div>
    );
  }

  const question = currentQuestion;
  if (!question) return null;

  const isQA = question.type === 'qna';
  const isEnded = session?.status === 'ended' || session?.status === 'reviewing';
  const hasCorrectAnswer = Boolean(question.correctAnswer);
  const answerRevealed = Boolean(question.revealedAt) || isEnded;

  return (
    <div className={`flex flex-col w-full h-full overflow-y-auto ${isQA ? 'pt-4' : 'justify-center gap-6 py-4'} relative`}>
      {/* 정답 공개 폭죽 3연발 (0.5초 간격) */}
      {confettiKey > 0 && hasCorrectAnswer && (
        <Suspense fallback={null}><ConfettiBurst key={`confetti-${confettiKey}`} /></Suspense>
      )}

      {/* Header — hidden for Q&A, or when hideTitle is set */}
      {!isQA && !question.hideTitle && (
      <div className="text-center space-y-2 self-center">
        <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">{question.title}</h2>
        {hasCorrectAnswer && isQuizQuestion(question) && (
          <p className="text-slate-400 text-sm">
            {answerRevealed ? `정답: ${question.correctAnswer}` : '정답 공개 전입니다. 먼저 답안을 모아보세요.'}
          </p>
        )}
        {question.imageUrl && (
          <img src={question.imageUrl} alt="" className="mt-3 max-h-48 rounded-xl object-cover mx-auto" />
        )}
      </div>
      )}

      {isQuizQuestion(question) && question.event && (
        <div className="w-full max-w-xl self-center px-8">
          <QuizEventBanner event={question.event} state={answerRevealed ? 'result' : 'active'} />
        </div>
      )}

      {/* Visualization */}
      <ErrorBoundary scope="visualization" fullPage={false}>
        <div className={isQA ? 'flex-1 overflow-y-auto px-4 py-3' : 'w-full'}>
          {question.type === 'choice' && (
            <BarChart
              sessionId={sessionId}
              questionId={currentQId}
              options={options}
              correctValue={question.correctAnswer}
              revealed={hasCorrectAnswer && answerRevealed}
            />
          )}
          {question.type === 'quiz' && (
            <>
              <BarChart
                sessionId={sessionId}
                questionId={currentQId}
                options={options}
                correctValue={question.correctAnswer}
                revealed={answerRevealed}
              />
              <ConfidenceStats sessionId={sessionId} questionId={currentQId} />
              {question.betting && (
                <BetDistribution sessionId={sessionId} questionId={currentQId} />
              )}
            </>
          )}
          {question.type === 'ox' && (
            <OXBattle
              sessionId={sessionId}
              questionId={currentQId}
              correctValue={question.correctAnswer}
              revealed={hasCorrectAnswer && answerRevealed}
            />
          )}
          {question.type === 'wordcloud' && <WordCloud sessionId={sessionId} questionId={currentQId} />}
          {question.type === 'scale' && <ScaleChart sessionId={sessionId} questionId={currentQId} />}
          {question.type === 'debate' && <DebateChart sessionId={sessionId} questionId={currentQId} />}
          {question.type === 'ranking' && <RankingChart sessionId={sessionId} questionId={currentQId} items={options} />}
          {question.type === 'fillinblank' && (
            <FillBlankChart
              sessionId={sessionId}
              questionId={currentQId}
              title={question.title}
              correctAnswer={question.correctAnswer}
              revealed={answerRevealed}
            />
          )}
          {question.type === 'check' && <CheckProgress sessionId={sessionId} questionId={currentQId} />}
          {question.type === 'imageSlide' && (
            <ImageSlidePresenter
              images={question.slideImages || []}
              currentSlide={question.currentSlide || 0}
              onSlideChange={isAdmin ? (idx) => update(ref(db, `sessions/${sessionId}/questions/${currentQId}`), { currentSlide: idx }) : undefined}
            />
          )}
          {question.type === 'mysteryBox' && (
            <>
              <MysteryBoxPresenter
                sessionId={sessionId}
                questionId={currentQId}
                question={question}
                revealed={answerRevealed}
              />
              {answerRevealed && (
                <CorrectAnswerRanking
                  sessionId={sessionId}
                  questionId={currentQId}
                  correctAnswer={question.correctAnswer}
                />
              )}
            </>
          )}
          {question.type === 'hintQuiz' && (
            <>
              <HintQuizPresenter
                sessionId={sessionId}
                questionId={currentQId}
                question={question}
                revealed={answerRevealed}
              />
              {answerRevealed && (
                <CorrectAnswerRanking
                  sessionId={sessionId}
                  questionId={currentQId}
                  correctAnswer={question.correctAnswer}
                  acceptableAnswers={question.acceptableAnswers}
                />
              )}
            </>
          )}
          {isQA && <QACards sessionId={sessionId} questionId={currentQId} title={question.title} />}
        </div>
      </ErrorBoundary>
    </div>
  );
});
