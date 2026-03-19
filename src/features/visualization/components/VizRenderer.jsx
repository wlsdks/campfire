import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';
import { Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import QuizEventBanner from '@/features/quiz/components/QuizEventBanner';
import { isQuizQuestion } from '@/lib/quiz';

const TYPE_LABELS = { choice: '객관식', ox: 'O/X', wordcloud: '워드클라우드', qna: 'Q&A', quiz: '퀴즈' };

export default function VizRenderer({ sessionId, session }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Sparkles size={24} className="text-slate-300" />
        </div>
        <p className="text-slate-300 text-lg font-medium">질문을 활성화하세요</p>
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!question) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 w-full">
      <div className="text-center space-y-2">
        <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
        <h2 className="text-3xl font-bold text-slate-900">{question.title}</h2>
        {isQuizQuestion(question) && (
          <p className="text-slate-400 text-sm">
            {question.revealedAt ? `정답 공개: ${question.correctAnswer}` : '정답 공개 전입니다. 먼저 답안을 모아보세요.'}
          </p>
        )}
      </div>
      {isQuizQuestion(question) && question.event && (
        <div className="w-full max-w-2xl">
          <QuizEventBanner event={question.event} state={question.revealedAt ? 'result' : 'active'} />
        </div>
      )}
      {question.type === 'choice' && <BarChart sessionId={sessionId} questionId={currentQId} options={question.options || []} />}
      {question.type === 'quiz' && (
        <BarChart
          sessionId={sessionId}
          questionId={currentQId}
          options={question.options || []}
          correctValue={question.correctAnswer}
          revealed={Boolean(question.revealedAt)}
        />
      )}
      {question.type === 'ox' && <OXBattle sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'wordcloud' && <WordCloud sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'qna' && <QACards sessionId={sessionId} questionId={currentQId} />}
    </div>
  );
}
