import { useSession } from '../../hooks/useSession';
import ChoiceVoter from '../../components/student/ChoiceVoter';
import OXVoter from '../../components/student/OXVoter';
import TextInput from '../../components/student/TextInput';
import WaitingPage from './WaitingPage';
import ConnectionDot from '../../components/ui/ConnectionDot';
import StudentBottomBar from '../../components/student/StudentBottomBar';

export default function VotePage({ sessionId }) {
  const { session, loading } = useSession(sessionId);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">🏓</div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (currentMode !== 'poll' || !currentQId) return <WaitingPage sessionId={sessionId} />;

  const question = session?.questions?.[currentQId];
  if (!question) return <WaitingPage sessionId={sessionId} />;

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-sm space-y-8 mt-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{question.title}</h2>
          <div className="w-12 h-0.5 bg-blue-500 mx-auto rounded-full" />
        </div>

        {question.type === 'choice' && (
          <ChoiceVoter key={currentQId} sessionId={sessionId} questionId={currentQId} options={question.options || []} />
        )}
        {question.type === 'ox' && (
          <OXVoter key={currentQId} sessionId={sessionId} questionId={currentQId} />
        )}
        {question.type === 'wordcloud' && (
          <TextInput key={currentQId} sessionId={sessionId} questionId={currentQId} placeholder="단어를 입력하세요" maxLength={20} />
        )}
        {question.type === 'qna' && (
          <TextInput key={currentQId} sessionId={sessionId} questionId={currentQId} placeholder="질문을 입력하세요" maxLength={200} />
        )}
      </div>
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2">
        <ConnectionDot />
      </div>
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
