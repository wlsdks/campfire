import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';

export default function VizRenderer({ sessionId, session }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (currentMode !== 'poll' || !currentQId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/30 text-2xl">질문을 활성화하세요</p>
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!question) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-3xl font-bold text-white text-center">{question.title}</h2>
      {question.type === 'choice' && <BarChart sessionId={sessionId} questionId={currentQId} options={question.options || []} />}
      {question.type === 'ox' && <OXBattle sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'wordcloud' && <WordCloud sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'qna' && <QACards sessionId={sessionId} questionId={currentQId} />}
    </div>
  );
}
