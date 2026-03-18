import BarChart from './BarChart';
import OXBattle from './OXBattle';
import WordCloud from './WordCloud';
import QACards from './QACards';

export default function VizRenderer({ sessionId, session }) {
  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (currentMode !== 'poll' || !currentQId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-5xl opacity-20">🏓</div>
        <p className="text-white/20 text-xl font-medium">질문을 활성화하세요</p>
      </div>
    );
  }

  const question = session?.questions?.[currentQId];
  if (!question) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 w-full">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-white">{question.title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full" />
      </div>
      {question.type === 'choice' && <BarChart sessionId={sessionId} questionId={currentQId} options={question.options || []} />}
      {question.type === 'ox' && <OXBattle sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'wordcloud' && <WordCloud sessionId={sessionId} questionId={currentQId} />}
      {question.type === 'qna' && <QACards sessionId={sessionId} questionId={currentQId} />}
    </div>
  );
}
