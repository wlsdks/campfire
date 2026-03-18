import { useState, useEffect, useCallback } from 'react';
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
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Sparkles, Loader2, Monitor, Target, Ticket, X, Users, Plus } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import TimerControls from '@/features/timer/components/TimerControls';
import TimerRing from '@/features/timer/components/TimerRing';

const STORED_SESSION_KEY = 'pinggo_admin_session';

export default function AdminPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('pinggo_admin') === 'true');
  const [sessionId, setSessionId] = useState(localStorage.getItem(STORED_SESSION_KEY) || '');
  const { session, loading } = useSession(sessionId);
  const { onlineList, count } = useParticipants(sessionId);
  const [presentMode, setPresentMode] = useState(false);
  const { isRunning: timerRunning, endTime, duration, startTimer, stopTimer } = useTimer(sessionId);

  const exitPresent = useCallback(() => setPresentMode(false), []);

  useEffect(() => {
    if (!presentMode) return;
    const handler = (e) => { if (e.key === 'Escape') exitPresent(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [presentMode, exitPresent]);

  async function createSession() {
    const newId = generateSessionId();
    await set(ref(db, `sessions/${newId}`), {
      status: 'active', currentQuestion: null, currentMode: 'waiting', createdAt: serverTimestamp(),
    });
    localStorage.setItem(STORED_SESSION_KEY, newId);
    setSessionId(newId);
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  if (!sessionId || (!loading && !session)) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
            <Sparkles size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pinggo</h1>
          <Button onClick={createSession} variant="primary" size="lg">
            <Plus size={20} />
            새 세션 만들기
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>불러오는 중...</span>
        </div>
      </div>
    );
  }

  const studentUrl = `${window.location.origin}/?s=${sessionId}`;
  const currentMode = session?.currentMode;
  const isGameActive = currentMode === 'roulette' || currentMode === 'lottery';

  function renderMainContent() {
    if (currentMode === 'roulette') return <Roulette participants={onlineList} />;
    if (currentMode === 'lottery') return <Lottery participants={onlineList} />;
    return <VizRenderer sessionId={sessionId} session={session} />;
  }

  if (presentMode) {
    return (
      <div className="min-h-dvh bg-white relative cursor-pointer" onClick={exitPresent}>
        <JoinToast sessionId={sessionId} />
        {/* Alerts overlay */}
        <div className="fixed top-5 left-5 w-72 space-y-3 z-10">
          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
        </div>
        {/* Main content — scaled up for projector */}
        <div className="flex items-center justify-center min-h-dvh p-12 text-lg">
          {renderMainContent()}
        </div>
        {/* QR bottom-right */}
        <div className="fixed bottom-5 right-5 opacity-60">
          <QRCode url={studentUrl} size={80} />
        </div>
        {/* Session info bottom-left */}
        <div className="fixed bottom-5 left-5 flex items-center gap-2">
          <Badge variant="success"><Users size={12} className="mr-1" />{count}명</Badge>
          <Badge variant="neutral">{sessionId}</Badge>
        </div>
        {/* Exit hint — top right */}
        <div className="fixed top-5 right-5 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-sm">
          ESC 또는 클릭으로 나가기
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <JoinToast sessionId={sessionId} />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles size={16} className="text-indigo-600" />
          </div>
          <span className="font-bold text-slate-900">Pinggo</span>
          <Badge variant="neutral">{sessionId}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {timerRunning && <TimerRing endTime={endTime} duration={duration} onExpire={stopTimer} size="sm" />}
          <Badge variant="success">
            <Users size={12} className="mr-1" />
            {count}명
          </Badge>
          <Button onClick={() => setPresentMode(true)} variant="primary" size="sm">
            <Monitor size={16} />
            발표 모드
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 border-r border-slate-200 bg-white p-5 overflow-y-auto flex flex-col shrink-0">
          <QuestionManager sessionId={sessionId} questions={session?.questions || {}} currentQuestion={session?.currentQuestion} />

          <div className="mt-4 pt-4 border-t border-slate-100">
            <TimerControls isRunning={timerRunning} onStart={startTimer} onStop={stopTimer} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">모드 전환</p>
            {[
              { mode: 'roulette', label: '돌림판', icon: Target },
              { mode: 'lottery', label: '제비뽑기', icon: Ticket },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => update(ref(db, `sessions/${sessionId}`), { currentMode: mode, currentQuestion: null })}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  currentMode === mode
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            {isGameActive && (
              <button
                onClick={() => update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting', currentQuestion: null })}
                className="w-full py-2.5 rounded-lg bg-slate-50 text-slate-500 text-sm font-medium hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> 게임 종료
              </button>
            )}
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
          {renderMainContent()}
        </div>

        {/* Right sidebar */}
        <div className="w-72 border-l border-slate-200 bg-white p-5 space-y-5 overflow-y-auto shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-900 font-bold text-lg">{count}</span>
            <span className="text-slate-400 text-sm">명 접속 중</span>
          </div>

          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
          <ParticipantList participants={onlineList} />

          <div className="border-t border-slate-100 pt-5">
            <div className="flex justify-center">
              <QRCode url={studentUrl} size={180} />
            </div>
            <p className="text-slate-400 text-xs mt-3 text-center break-all leading-relaxed">{studentUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
