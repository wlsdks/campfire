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
      <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-6xl">🏓</div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Pinggo
          </h1>
          <button
            onClick={createSession}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            새 세션 만들기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-shimmer">🏓</div>
          <p className="text-white/50">로딩 중...</p>
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
      <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 relative cursor-pointer" onClick={() => setPresentMode(false)}>
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
        <div className="fixed top-4 right-4 glass rounded-xl px-3 py-1.5 text-white/40 text-sm">
          클릭하면 관리 모드로 복귀
        </div>
      </div>
    );
  }

  const isGameActive = currentMode === 'roulette' || currentMode === 'lottery';

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      <JoinToast sessionId={sessionId} />

      {/* Left sidebar: questions + controls */}
      <div className="w-80 border-r border-white/5 bg-white/[0.02] p-5 overflow-y-auto flex flex-col">
        <QuestionManager
          sessionId={sessionId}
          questions={session?.questions || {}}
          currentQuestion={session?.currentQuestion}
        />

        {/* Game & mode controls */}
        <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">모드 전환</p>

          <button
            onClick={() => setPresentMode(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
          >
            <span>📺</span> 발표 모드
          </button>

          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'roulette', currentQuestion: null });
            }}
            className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              currentMode === 'roulette'
                ? 'bg-amber-500 shadow-lg shadow-amber-500/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span>🎯</span> 돌림판
          </button>

          <button
            onClick={async () => {
              await update(ref(db, `sessions/${sessionId}`), { currentMode: 'lottery', currentQuestion: null });
            }}
            className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              currentMode === 'lottery'
                ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span>🎰</span> 제비뽑기
          </button>

          {isGameActive && (
            <button
              onClick={async () => {
                await update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting', currentQuestion: null });
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
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
      <div className="w-72 border-l border-white/5 bg-white/[0.02] p-5 space-y-5 overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold text-lg">{count}</span>
          <span className="text-white/40 text-sm">명 접속 중</span>
        </div>

        <HandRaiseList sessionId={sessionId} />
        <UrgentQuestionList sessionId={sessionId} />
        <ParticipantList participants={onlineList} />

        <div className="border-t border-white/5 pt-5">
          <div className="flex justify-center">
            <QRCode url={studentUrl} size={180} />
          </div>
          <p className="text-white/30 text-xs mt-3 text-center break-all leading-relaxed">{studentUrl}</p>
        </div>
      </div>
    </div>
  );
}
