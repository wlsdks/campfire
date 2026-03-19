import { useState, useEffect, useCallback } from 'react';
import { ref, set, serverTimestamp, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useScores } from '@/features/quiz/api/useScores';
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
import { Radio, Loader2, Monitor, Target, Ticket, Trophy, X, Users, Plus, AlertCircle, Copy, Check } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import TimerControls from '@/features/timer/components/TimerControls';
import TimerRing from '@/features/timer/components/TimerRing';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import Leaderboard from '@/features/quiz/components/Leaderboard';

const STORED_SESSION_KEY = 'pinggo_admin_session';

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

export default function AdminPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('pinggo_admin') === 'true');
  const [sessionId, setSessionId] = useState(localStorage.getItem(STORED_SESSION_KEY) || '');
  const { session, loading } = useSession(sessionId);
  const { participants, onlineList, count } = useParticipants(sessionId);
  const { scores, leaderboard, totalTickets } = useScores(sessionId);
  const [presentMode, setPresentMode] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [copied, setCopied] = useState(false);
  const { isRunning: timerRunning, endTime, duration, startTimer, stopTimer } = useTimer(sessionId);

  const exitPresent = useCallback(() => setPresentMode(false), []);

  useEffect(() => {
    if (!presentMode) return;
    const handler = (e) => { if (e.key === 'Escape') exitPresent(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [presentMode, exitPresent]);

  const [creating, setCreating] = useState(false);

  async function createSession() {
    try {
      setCreateError(null);
      setCreating(true);
      const newId = generateSessionId();
      await set(ref(db, `sessions/${newId}`), {
        status: 'active', currentQuestion: null, currentMode: 'waiting', createdAt: serverTimestamp(),
      });
      localStorage.setItem(STORED_SESSION_KEY, newId);
      setSessionId(newId);
    } catch {
      setCreateError('세션 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCreating(false);
    }
  }

  async function switchMode(mode) {
    try {
      await update(ref(db, `sessions/${sessionId}`), mode === 'leaderboard'
        ? { currentMode: mode }
        : { currentMode: mode, currentQuestion: null });
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function copyStudentLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?s=${sessionId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  if (!sessionId || (!loading && !session)) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-5">
          <Radio size={36} className="text-indigo-600 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Pinggo</h1>
          <Button onClick={createSession} variant="primary" size="lg" disabled={creating}>
            {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            {creating ? '생성 중...' : '새 세션 만들기'}
          </Button>
          {createError && (
            <p className="text-red-500 text-sm flex items-center justify-center gap-1.5">
              <AlertCircle size={14} />
              {createError}
            </p>
          )}
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
  const drawParticipants = onlineList.map((participant) => ({
    ...participant,
    ...scores[participant.id],
    tickets: scores[participant.id]?.tickets || 0,
  }));
  const isSpecialMode = ['roulette', 'lottery', 'leaderboard'].includes(currentMode);

  if (presentMode) {
    return (
      <div className="min-h-dvh bg-white relative cursor-pointer" onClick={exitPresent}>
        <JoinToast sessionId={sessionId} />
        <ReactionOverlay sessionId={sessionId} />
        {/* Alerts overlay */}
        <div className="fixed top-5 left-5 w-72 space-y-3 z-10">
          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
        </div>
        {/* Main content — scaled up for projector */}
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
        {/* QR bottom-right */}
        <div className="fixed bottom-5 right-5 opacity-90 flex items-center gap-3">
          <span className="text-slate-600 text-sm font-medium bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">{studentUrl}</span>
          <QRCode url={studentUrl} size={120} />
        </div>
        {/* Session info bottom-left */}
        <div className="fixed bottom-5 left-5 flex items-center gap-2">
          <Badge variant="neutral"><Users size={12} className="mr-1" />{count}명</Badge>
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
      <ReactionOverlay sessionId={sessionId} />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Radio size={18} className="text-indigo-600" />
          <span className="font-bold text-slate-900">Pinggo</span>
          <span className="text-xs text-slate-400 font-mono">{sessionId}</span>
        </div>
        <div className="flex items-center gap-3">
          {timerRunning && <TimerRing endTime={endTime} duration={duration} onExpire={stopTimer} size="sm" />}
          <Badge variant="neutral">
            <Users size={12} className="mr-1" />
            {count}명
          </Badge>
          {totalTickets > 0 && <Badge variant="neutral">{totalTickets}장 티켓</Badge>}
          {session?.pendingEvent?.label && <Badge variant="primary">{session.pendingEvent.label}</Badge>}
          <Button onClick={() => setPresentMode(true)} variant="primary" size="sm">
            <Monitor size={16} />
            발표 모드
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[420px] border-r border-slate-200 bg-white p-5 overflow-y-auto flex flex-col shrink-0">
          <QuestionManager
            sessionId={sessionId}
            questions={session?.questions || {}}
            currentQuestion={session?.currentQuestion}
            scores={scores}
            participants={participants}
            pendingEvent={session?.pendingEvent || null}
          />

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <TimerControls isRunning={timerRunning} onStart={startTimer} onStop={stopTimer} />
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">모드 전환</p>
            {[
              { mode: 'roulette', label: '돌림판', icon: Target },
              { mode: 'lottery', label: totalTickets > 0 ? '보상 추첨' : '제비뽑기', icon: Ticket },
              ...(leaderboard.length > 0 ? [{ mode: 'leaderboard', label: '리더보드', icon: Trophy }] : []),
            ].map(({ mode, label, icon: Icon }) => {
              const isActive = currentMode === mode;
              return isActive ? (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  className="w-full inline-flex items-center gap-1.5 py-1.5 px-3 text-sm font-medium rounded-lg bg-slate-900 text-white transition-colors"
                  aria-label={`${label} 모드로 전환`}
                >
                  <Icon size={16} /> {label}
                </button>
              ) : (
                <Button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  aria-label={`${label} 모드로 전환`}
                >
                  <Icon size={16} /> {label}
                </Button>
              );
            })}
            {isSpecialMode && (
              <Button
                onClick={() => switchMode('waiting')}
                variant="ghost"
                size="sm"
                className="w-full"
                aria-label="특수 화면 종료"
              >
                <X size={16} /> 화면 종료
              </Button>
            )}
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
          <MainContent
            currentMode={currentMode}
            sessionId={sessionId}
            session={session}
            onlineList={onlineList}
            leaderboard={leaderboard}
            drawParticipants={drawParticipants}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-[360px] border-l border-slate-200 bg-white p-5 space-y-5 overflow-y-auto shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-900 font-bold text-lg">{count}</span>
            <span className="text-slate-400 text-sm">명 접속 중</span>
          </div>

          {(() => {
            const activeQId = session?.currentQuestion;
            const activeQ = activeQId ? session?.questions?.[activeQId] : null;
            const voted = activeQ?.votes ? Object.keys(activeQ.votes).length : 0;
            const total = count || 0;
            const pct = total > 0 ? Math.round((voted / total) * 100) : 0;
            if (!activeQ) return null;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-medium">참여율</span>
                  <span className="text-slate-600 text-xs font-semibold">{voted}/{total}명 투표</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <HandRaiseList sessionId={sessionId} />
          <UrgentQuestionList sessionId={sessionId} />
          {leaderboard.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <Leaderboard entries={leaderboard} maxShow={5} title="상위 랭킹" />
            </div>
          )}
          <ParticipantList participants={onlineList} />

          <div className="border-t border-slate-100 pt-5">
            <div className="flex justify-center">
              <QRCode url={studentUrl} size={180} />
            </div>
            <Button onClick={copyStudentLink} variant="secondary" size="sm" className="w-full mt-4">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '링크 복사됨' : '초대 링크 복사'}
            </Button>
            <p className="text-slate-400 text-xs mt-3 text-center break-all leading-relaxed">{studentUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
