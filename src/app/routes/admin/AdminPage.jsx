import { useState } from 'react';
import { ref, set, serverTimestamp, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { generateSessionId } from '@/lib/utils';
import AdminLogin from './AdminLogin';
import QuestionManager from './QuestionManager';
import ParticipantList from '@/features/participants/components/ParticipantList';
import QRCode from '@/components/ui/QRCode';
import VizRenderer from '@/features/visualization/components/VizRenderer';
import Roulette from '@/features/games/components/Roulette';
import Lottery from '@/features/games/components/Lottery';
import JoinToast from '@/features/participants/components/JoinToast';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';

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
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-6xl">🏓</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pinggo
          </h1>
          <button
            onClick={createSession}
            className="px-10 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold shadow-sm transition-all"
          >
            새 세션 만들기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🏓</div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  const studentUrl = `${window.location.origin}/?s=${sessionId}`;
  const currentMode = session?.currentMode;

  // Shared content renderer for both normal and presentation mode
  function renderMainContent() {
    if (currentMode === 'roulette') {
      return <Roulette participants={onlineList} />;
    }
    if (currentMode === 'lottery') {
      return <Lottery participants={onlineList} />;
    }
    return <VizRenderer sessionId={sessionId} session={session} />;
  }

  if (presentMode) {
    return (
      <div className="min-h-dvh bg-gray-50 p-8 relative cursor-pointer" onClick={() => setPresentMode(false)}>
        <JoinToast sessionId={sessionId} />
        <div className="fixed top-4 left-4 w-72 space-y-3 z-10">
          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
        </div>
        <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
          {renderMainContent()}
        </div>
        <div className="fixed bottom-4 right-4 opacity-70">
          <QRCode url={studentUrl} size={80} />
        </div>
        <div className="fixed top-4 right-4 bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-1.5 text-gray-400 text-sm">
          클릭하면 관리 모드로 복귀
        </div>
      </div>
    );
  }

  const isGameActive = currentMode === 'roulette' || currentMode === 'lottery';

  return (
    <div className="min-h-dvh bg-gray-50 flex">
      <JoinToast sessionId={sessionId} />

      {/* Left sidebar: questions + controls */}
      <div className="w-80 border-r border-gray-200 bg-white p-5 overflow-y-auto flex flex-col">
        <QuestionManager
          sessionId={sessionId}
          questions={session?.questions || {}}
          currentQuestion={session?.currentQuestion}
        />

        {/* Game & mode controls */}
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">모드 전환</p>

          <button
            onClick={() => setPresentMode(true)}
            className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>📺</span> 발표 모드
          </button>

          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'roulette', currentQuestion: null });
            }}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              currentMode === 'roulette'
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🎯</span> 돌림판
          </button>

          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'lottery', currentQuestion: null });
            }}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              currentMode === 'lottery'
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🎰</span> 제비뽑기
          </button>

          {isGameActive && (
            <button
              onClick={async () => {
                await update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting', currentQuestion: null });
              }}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <span>✕</span> 게임 종료
            </button>
          )}
        </div>
      </div>

      {/* Center: visualization */}
      <div className="flex-1 p-8 flex items-center justify-center">
        {renderMainContent()}
      </div>

      {/* Right sidebar: participants + QR */}
      <div className="w-72 border-l border-gray-200 bg-white p-5 space-y-5 overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-900 font-bold text-lg">{count}</span>
          <span className="text-gray-400 text-sm">명 접속 중</span>
        </div>

        <HandRaiseList sessionId={sessionId} />
        <UrgentQuestionList sessionId={sessionId} />
        <ParticipantList participants={onlineList} />

        <div className="border-t border-gray-100 pt-5">
          <div className="flex justify-center">
            <QRCode url={studentUrl} size={180} />
          </div>
          <p className="text-gray-400 text-xs mt-3 text-center break-all leading-relaxed">{studentUrl}</p>
        </div>
      </div>
    </div>
  );
}
