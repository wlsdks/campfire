import { useCallback, useEffect } from 'react';
import { Users } from 'lucide-react';
import QRCode from '@/components/ui/QRCode';
import VizRenderer from '@/features/visualization/components/VizRenderer';
import Roulette from '@/features/games/components/Roulette';
import Lottery from '@/features/games/components/Lottery';
import JoinToast from '@/features/participants/components/JoinToast';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';
import Badge from '@/components/ui/Badge';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import Leaderboard from '@/features/quiz/components/Leaderboard';

function PresentEmptyState({ sessionId, studentUrl, count }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <QRCode url={studentUrl} size={200} />
      <p className="text-slate-500 text-base break-all max-w-md text-center">{studentUrl}</p>
      <p className="text-slate-400 text-sm">학생들이 QR코드를 스캔하여 참여할 수 있습니다</p>
      <div className="flex items-center gap-3">
        <Badge variant="neutral"><Users size={14} className="mr-1" />{count}명 접속 중</Badge>
        <Badge variant="neutral">{sessionId}</Badge>
      </div>
    </div>
  );
}

function MainContent({ currentMode, sessionId, session, onlineList, leaderboard, drawParticipants, presentMode, studentUrl, count }) {
  if (currentMode === 'roulette') return <Roulette participants={onlineList} />;
  if (currentMode === 'lottery') return <Lottery participants={drawParticipants} />;
  if (currentMode === 'leaderboard') {
    return <Leaderboard entries={leaderboard} maxShow={10} title="실시간 리더보드" emptyLabel="아직 점수가 없습니다" />;
  }

  const currentQId = session?.currentQuestion;
  const isActive = ['poll', 'quiz'].includes(currentMode) && currentQId;

  if (presentMode && !isActive) {
    return <PresentEmptyState sessionId={sessionId} studentUrl={studentUrl} count={count} />;
  }

  return <VizRenderer sessionId={sessionId} session={session} />;
}

export { MainContent };

export default function PresentationView({ sessionId, session, currentMode, onlineList, leaderboard, drawParticipants, studentUrl, count, onExit }) {
  const exitPresent = useCallback(() => onExit(), [onExit]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') exitPresent(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exitPresent]);

  return (
    <div className="min-h-dvh bg-white relative cursor-pointer" onClick={exitPresent}>
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />
      <div className="fixed top-5 left-5 w-72 space-y-3 z-10">
        <HandRaiseList sessionId={sessionId} />
        <UrgentQuestionList sessionId={sessionId} />
      </div>
      <div className="flex items-center justify-center min-h-dvh p-12 text-lg">
        <MainContent
          currentMode={currentMode}
          sessionId={sessionId}
          session={session}
          onlineList={onlineList}
          leaderboard={leaderboard}
          drawParticipants={drawParticipants}
          presentMode
          studentUrl={studentUrl}
          count={count}
        />
      </div>
      <div className="fixed bottom-5 right-5 opacity-90 flex items-center gap-3">
        <span className="text-slate-600 text-sm font-medium bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">{studentUrl}</span>
        <QRCode url={studentUrl} size={120} />
      </div>
      <div className="fixed bottom-5 left-5 flex items-center gap-2">
        <Badge variant="neutral"><Users size={12} className="mr-1" />{count}명</Badge>
        <Badge variant="neutral">{sessionId}</Badge>
      </div>
      <div className="fixed top-5 right-5 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-sm">
        ESC 또는 클릭으로 나가기
      </div>
    </div>
  );
}
