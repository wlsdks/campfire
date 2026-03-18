import { useState } from 'react';
import { ref, set, serverTimestamp, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useSession } from '../../hooks/useSession';
import { useParticipants } from '../../hooks/useParticipants';
import { generateSessionId } from '../../lib/utils';
import AdminLogin from './AdminLogin';
import QuestionManager from './QuestionManager';
import ParticipantList from '../../components/ui/ParticipantList';
import QRCode from '../../components/ui/QRCode';
import VizRenderer from '../../components/viz/VizRenderer';
import Roulette from '../../components/game/Roulette';
import Lottery from '../../components/game/Lottery';
import JoinToast from '../../components/ui/JoinToast';
import HandRaiseList from '../../components/ui/HandRaiseList';
import UrgentQuestionList from '../../components/ui/UrgentQuestionList';

const STORED_SESSION_KEY = 'shotshot_admin_session';

export default function AdminPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('shotshot_admin') === 'true');
  const [sessionId, setSessionId] = useState(localStorage.getItem(STORED_SESSION_KEY) || '');
  const { session, loading } = useSession(sessionId);
  const { onlineList, count } = useParticipants(sessionId);
  const [presentMode, setPresentMode] = useState(false);

  async function createSession() {
    const newId = generateSessionId();
    await set(ref(db, `sessions/${newId}`), {
      status: 'active',
      currentQuestion: null,
      currentMode: 'waiting',
      createdAt: serverTimestamp(),
    });
    localStorage.setItem(STORED_SESSION_KEY, newId);
    setSessionId(newId);
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  if (!sessionId || (!loading && !session)) {
    return (
      <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
        <button onClick={createSession} className="px-8 py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold">
          새 세션 만들기
        </button>
      </div>
    );
  }

  if (loading) return <div className="min-h-dvh bg-gray-950 flex items-center justify-center text-white">로딩 중...</div>;

  const studentUrl = `${window.location.origin}/?s=${sessionId}`;

  if (presentMode) {
    return (
      <div className="min-h-dvh bg-gray-950 p-8 relative" onClick={() => setPresentMode(false)}>
        <JoinToast sessionId={sessionId} />
        <div className="fixed top-4 left-4 w-72 space-y-3 z-10">
          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
        </div>
        <VizRenderer sessionId={sessionId} session={session} />
        <div className="fixed bottom-4 right-4 opacity-70">
          <QRCode url={studentUrl} size={80} />
        </div>
        <div className="fixed top-4 right-4 text-white/40 text-sm">클릭하면 관리 모드로 복귀</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-950 flex">
      <JoinToast sessionId={sessionId} />
      {/* Left sidebar: questions */}
      <div className="w-80 border-r border-white/10 p-4 overflow-y-auto">
        <QuestionManager
          sessionId={sessionId}
          questions={session?.questions || {}}
          currentQuestion={session?.currentQuestion}
        />
        <div className="mt-6 space-y-2">
          <button onClick={() => setPresentMode(true)} className="w-full py-2 rounded-lg bg-purple-600 text-white text-sm">
            발표 모드
          </button>
          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'roulette', currentQuestion: null });
            }}
            className="w-full py-2 rounded-lg bg-amber-600 text-white text-sm"
          >
            돌림판
          </button>
          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'lottery', currentQuestion: null });
            }}
            className="w-full py-2 rounded-lg bg-yellow-600 text-white text-sm"
          >
            제비뽑기
          </button>
          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting', currentQuestion: null });
            }}
            className="w-full py-2 rounded-lg bg-gray-600 text-white text-sm"
          >
            게임 종료
          </button>
        </div>
      </div>

      {/* Center: visualization */}
      <div className="flex-1 p-8">
        {session?.currentMode === 'roulette' ? (
          <Roulette participants={onlineList} />
        ) : session?.currentMode === 'lottery' ? (
          <Lottery participants={onlineList} />
        ) : (
          <VizRenderer sessionId={sessionId} session={session} />
        )}
      </div>

      {/* Right sidebar: participants + QR */}
      <div className="w-64 border-l border-white/10 p-4 space-y-4">
        <div className="text-white font-semibold">참여자 ({count}명)</div>
        <HandRaiseList sessionId={sessionId} />
        <UrgentQuestionList sessionId={sessionId} />
        <ParticipantList participants={onlineList} />
        <div className="border-t border-white/10 pt-4">
          <QRCode url={studentUrl} size={200} />
          <p className="text-white/40 text-xs mt-2 text-center break-all">{studentUrl}</p>
        </div>
      </div>
    </div>
  );
}
