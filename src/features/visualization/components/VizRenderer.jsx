import { memo, useMemo } from 'react';
import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';
import ScaleChart from './ScaleChart';
import DebateChart from './DebateChart';
import RankingChart from './RankingChart';
import FillBlankChart from './FillBlankChart';
import BetDistribution from './BetDistribution';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import { isQuizQuestion } from '@/lib/quiz';

const TYPE_LABELS = { choice: '객관식', ox: 'O/X', wordcloud: '워드클라우드', qna: 'Q&A', quiz: '퀴즈', scale: '감정 온도계', debate: '찬반 토론', ranking: '순위 맞추기', fillinblank: '빈칸 채우기' };

export default memo(function VizRenderer({ sessionId, session }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    const hasQuestions = session?.questions && Object.keys(session.questions).length > 0;
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title={hasQuestions ? '질문이 준비되어 있습니다' : '아직 질문이 없습니다'}
          description={hasQuestions
            ? '왼쪽 패널에서 질문을 활성화하면 여기에 실시간 결과가 표시됩니다'
            : '왼쪽 상단의 + 추가 버튼으로 첫 질문을 만들어보세요'}
          steps={hasQuestions
            ? ['왼쪽 목록에서 질문을 선택하세요', '재생 버튼으로 활성화하세요', '학생 응답이 실시간으로 나타납니다']
            : ['+ 추가 버튼으로 질문을 만드세요', '객관식, O/X, 워드클라우드 등 선택', '질문을 활성화하면 수업이 시작됩니다']}
          mascotSize="lg"
          mood="waiting"
          className="py-8"
        />
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!question) return null;

  const isQA = question.type === 'qna';
  const isEnded = session?.status === 'ended' || session?.status === 'reviewing';
  const hasCorrectAnswer = Boolean(question.correctAnswer);
  const answerRevealed = Boolean(question.revealedAt) || isEnded;

  return (
    <div className={`flex flex-col w-full h-full ${isQA ? 'pt-4' : 'justify-center gap-6'}`}>
      {/* Header — hidden for Q&A (QACards has its own), centered for others */}
      {!isQA && (
      <div className="text-center space-y-2 self-center">
        <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
        <h2 className="text-3xl font-bold text-slate-900">{question.title}</h2>
        {hasCorrectAnswer && isQuizQuestion(question) && (
          <p className="text-slate-400 text-sm">
            {answerRevealed ? `정답: ${question.correctAnswer}` : '정답 공개 전입니다. 먼저 답안을 모아보세요.'}
          </p>
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
              options={question.options || []}
              correctValue={question.correctAnswer}
              revealed={hasCorrectAnswer && answerRevealed}
            />
          )}
          {question.type === 'quiz' && (
            <>
              <BarChart
                sessionId={sessionId}
                questionId={currentQId}
                options={question.options || []}
                correctValue={question.correctAnswer}
                revealed={answerRevealed}
              />
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
          {question.type === 'ranking' && <RankingChart sessionId={sessionId} questionId={currentQId} items={question.options || []} />}
          {question.type === 'fillinblank' && (
            <FillBlankChart
              sessionId={sessionId}
              questionId={currentQId}
              title={question.title}
              correctAnswer={question.correctAnswer}
              revealed={answerRevealed}
            />
          )}
          {isQA && <QACards sessionId={sessionId} questionId={currentQId} title={question.title} />}
        </div>
      </ErrorBoundary>
    </div>
  );
});
