import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import { isQuizQuestion } from '@/lib/quiz';

const TYPE_LABELS = { choice: '객관식', ox: 'O/X', wordcloud: '워드클라우드', qna: 'Q&A', quiz: '퀴즈' };

export default function VizRenderer({ sessionId, session }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (!['poll', 'quiz'].includes(currentMode) || !currentQId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <BarChart3 size={36} className="text-slate-300" />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-lg font-medium">아직 활성화된 질문이 없습니다</p>
          <p className="text-slate-300 text-sm">왼쪽 패널에서 질문을 선택하고 시작하세요</p>
        </div>
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!question) return null;

  const isQA = question.type === 'qna';
  const isEnded = session?.status === 'ended';
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
        <div className="w-full max-w-4xl self-center">
          <QuizEventBanner event={question.event} state={answerRevealed ? 'result' : 'active'} />
        </div>
      )}

      {/* Visualization */}
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
          <BarChart
            sessionId={sessionId}
            questionId={currentQId}
            options={question.options || []}
            correctValue={question.correctAnswer}
            revealed={answerRevealed}
          />
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
        {isQA && <QACards sessionId={sessionId} questionId={currentQId} title={question.title} />}
      </div>
    </div>
  );
}
