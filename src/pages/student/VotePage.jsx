import { useSession } from '../../hooks/useSession';
import ChoiceVoter from '../../components/student/ChoiceVoter';
import OXVoter from '../../components/student/OXVoter';
import TextInput from '../../components/student/TextInput';
import WaitingPage from './WaitingPage';
import ConnectionDot from '../../components/ui/ConnectionDot';
import StudentBottomBar from '../../components/student/StudentBottomBar';

export default function VotePage({ sessionId }) {
  const { session, loading } = useSession(sessionId);

  if (loading) return <div className="min-h-dvh bg-gray-950 flex items-center justify-center text-white">로딩 중...</div>;

  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;

  if (currentMode !== 'poll' || !currentQId) return <WaitingPage sessionId={sessionId} />;

  const question = session?.questions?.[currentQId];
  if (!question) return <WaitingPage sessionId={sessionId} />;

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col items-center p-4 pb-20">
      <div className="w-full max-w-sm space-y-6 mt-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{question.title}</h2>
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
      <div className="fixed bottom-4">
        <ConnectionDot />
      </div>
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
