import { useState, useEffect, useCallback, useMemo } from 'react';
import { ref, update, set } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useScores } from '@/features/quiz/api/useScores';
import { useAdminApprovals } from '@/features/session/api/useAdminApprovals';
import AdminLogin from './AdminLogin';
import SessionDashboard from './SessionDashboard';
import QuestionManager from './QuestionManager';
import QuestionForm from './QuestionForm';
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
import { Radio, Loader2, Monitor, Target, Ticket, Trophy, X, Users, Copy, Check, ArrowLeft, PanelLeftClose, PanelLeftOpen, Square, Play } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import TimerControls from '@/features/timer/components/TimerControls';
import TimerRing from '@/features/timer/components/TimerRing';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import { generateQuestionId } from '@/lib/utils';
import { QUIZ_DEFAULTS } from '@/lib/quiz';

function getAdminUser() {
  try {
    const raw = sessionStorage.getItem('pinggo_admin');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.uid && parsed.username) return parsed;
    return null;
  } catch {
    return null;
  }
}

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

function ClassSummary({ session, participants, leaderboard, count }) {
  const questions = session?.questions || {};
  const questionList = Object.values(questions);
  const totalResponses = questionList.reduce((sum, q) => sum + (q.votes ? Object.keys(q.votes).length : 0), 0);
  const participantCount = Object.keys(participants).length;
  const voterIds = new Set();
  questionList.forEach((q) => {
    if (q.votes) Object.keys(q.votes).forEach((pid) => voterIds.add(pid));
  });
  const activeCount = voterIds.size;
  const activityRate = participantCount > 0 ? Math.round((activeCount / participantCount) * 100) : 0;
  const topStudent = leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-slate-900">클래스 요약</h2>
        <p className="text-sm text-slate-400 mt-1">
          {session?.courseName} {session?.roundNumber}차
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{participantCount}</p>
          <p className="text-xs text-slate-400 mt-1">참여자</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{questionList.length}</p>
          <p className="text-xs text-slate-400 mt-1">질문</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{activityRate}%</p>
          <p className="text-xs text-slate-400 mt-1">참여율</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${activityRate}%` }} />
          </div>
        </div>
      </div>

      {topStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
            {topStudent.nickname?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">최고의 학생</p>
            <p className="text-lg font-bold text-slate-900">{topStudent.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{topStudent.total}</p>
            <p className="text-xs text-slate-400">점</p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">왼쪽에서 질문을 클릭하면 결과를 볼 수 있습니다</p>
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

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key) || '';
}

function setUrlParams(params) {
  const url = new URL(window.location);
  // Clear all admin params first
  url.searchParams.delete('s');
  url.searchParams.delete('edit');
  url.searchParams.delete('editName');
  // Set new params
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  window.history.replaceState({}, '', url);
}

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(() => getAdminUser());
  const [sessionId, setSessionId] = useState(() => getUrlParam('s'));
  const [readOnly, setReadOnly] = useState(false);
  const { session, loading } = useSession(sessionId);
  const { participants, onlineList, count } = useParticipants(sessionId);
  const { scores, leaderboard, totalTickets } = useScores(sessionId);
  const [presentMode, setPresentMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isRunning: timerRunning, endTime, duration, startTimer, stopTimer } = useTimer(sessionId);
  const { pendingAdmins, pendingCount, approveAdmin, rejectAdmin } = useAdminApprovals();

  const isSetting = session?.status === 'setting';
  const isEnded = session?.status === 'ended';

  // Derive readOnly from session status (ended sessions are always read-only)
  const effectiveReadOnly = readOnly || isEnded;

  // Feature 4: Collapsible sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Feature 5: Center panel question form
  const [showCenterForm, setShowCenterForm] = useState(false);

  const isMaster = adminUser?.role === 'master';

  const exitPresent = useCallback(() => setPresentMode(false), []);

  useEffect(() => {
    if (!presentMode) return;
    const handler = (e) => { if (e.key === 'Escape') exitPresent(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [presentMode, exitPresent]);

  function handleLogin() {
    setAdminUser(getAdminUser());
  }

  function handleSelectSession(id, isReadOnly) {
    setSessionId(id);
    setReadOnly(isReadOnly);
    setUrlParams({ s: id });
  }

  function handleBack() {
    setSessionId('');
    setReadOnly(false);
    setPresentMode(false);
    setUrlParams({});
  }

  function handleLogout() {
    sessionStorage.removeItem('pinggo_admin');
    setAdminUser(null);
    setSessionId('');
    setUrlParams({});
  }

  async function switchMode(mode) {
    if (effectiveReadOnly) return;
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

  // Start session (setting → active)
  async function handleStartSession() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { status: 'active' });
    } catch {
      // Silently fail
    }
  }

  // End session
  async function handleEndSession() {
    if (!window.confirm('클래스를 종료하시겠습니까? 종료 후 학생들은 더 이상 참여할 수 없습니다.')) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), {
        status: 'ended',
        currentMode: 'waiting',
        currentQuestion: null,
      });
      handleBack();
    } catch {
      // Silently fail
    }
  }

  // Feature 5: Center form question submit
  async function handleCenterFormSubmit({ type, title, options: cleanOptions, correctAnswer }) {
    try {
      const qId = generateQuestionId();
      const questions = session?.questions || {};
      const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
      const isChoiceLike = type === 'choice' || type === 'quiz';

      if (isChoiceLike) {
        questionData.options = cleanOptions;
      }
      if (type === 'quiz') {
        questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
        questionData.points = QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
      }

      await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
      setShowCenterForm(false);
      return true;
    } catch {
      return false;
    }
  }

  // 1. Not authenticated → Login
  if (!adminUser) return <AdminLogin onLogin={handleLogin} />;

  // 2. No session selected → Dashboard
  if (!sessionId) {
    return (
      <SessionDashboard
        onSelectSession={handleSelectSession}
        onLogout={handleLogout}
        adminUser={adminUser}
        isMaster={isMaster}
        pendingAdmins={pendingAdmins}
        pendingCount={pendingCount}
        approveAdmin={approveAdmin}
        rejectAdmin={rejectAdmin}
      />
    );
  }

  // 3. Loading session data
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

  // 4. Session not found → back to dashboard
  if (!session) {
    handleBack();
    return null;
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

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="클래스 목록으로"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                {session?.courseName || 'Pinggo'}
              </span>
              {session?.roundNumber && (
                <span className="text-sm font-medium text-slate-500">{session.roundNumber}차</span>
              )}
              {effectiveReadOnly && <Badge variant="neutral">클래스 확인</Badge>}
              {isSetting && <Badge variant="warning" className="py-1 px-2.5 text-xs font-semibold text-amber-600 bg-amber-50 border-amber-200">세팅중</Badge>}
            </div>
            <span className="text-xs text-slate-400 font-mono">{sessionId}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {timerRunning && <TimerRing endTime={endTime} duration={duration} onExpire={stopTimer} size="sm" />}
          <Badge variant="neutral" className="py-2 px-3.5 text-sm">
            <Users size={16} className="mr-1.5" />
            {count}명
          </Badge>
          {totalTickets > 0 && <Badge variant="neutral" className="py-2 px-3.5 text-sm">{totalTickets}장 티켓</Badge>}
          {session?.pendingEvent?.label && <Badge variant="primary" className="py-2 px-3.5 text-sm">{session.pendingEvent.label}</Badge>}
          {!effectiveReadOnly && isSetting && (
            <Button onClick={handleStartSession} variant="primary" size="sm">
              <Play size={18} />
              시작하기
            </Button>
          )}
          {!effectiveReadOnly && !isSetting && (
            <>
              <Button onClick={() => setPresentMode(true)} variant="primary" size="sm">
                <Monitor size={18} />
                발표 모드
              </Button>
              <Button onClick={handleEndSession} variant="secondary" size="sm">
                <Square size={18} />
                종료
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar collapse toggle (visible when collapsed) */}
        <AnimatePresence>
          {sidebarCollapsed && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSidebarCollapsed(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-200 border-l-0 rounded-r-xl p-3 shadow-md text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="사이드바 열기"
            >
              <PanelLeftOpen size={22} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Left sidebar */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 0 : 460 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="border-r border-slate-200 bg-white overflow-hidden shrink-0"
        >
          <div className="w-[460px] p-5 overflow-y-auto h-full flex flex-col">
            <QuestionManager
              onCollapse={effectiveReadOnly ? undefined : () => setSidebarCollapsed(true)}
              sessionId={sessionId}
              questions={session?.questions || {}}
              currentQuestion={session?.currentQuestion}
              scores={scores}
              participants={participants}
              pendingEvent={session?.pendingEvent || null}
              readOnly={effectiveReadOnly}
              onAddClick={effectiveReadOnly ? undefined : () => setShowCenterForm(true)}
              onViewQuestion={effectiveReadOnly ? async (qId) => {
                try { await update(ref(db, `sessions/${sessionId}`), { currentQuestion: qId, currentMode: 'poll' }); } catch {}
              } : undefined}
            />

            {!effectiveReadOnly && (
              <>
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
              </>
            )}
          </div>
        </motion.div>

        {/* Center */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto relative">
          <AnimatePresence mode="wait">
            {showCenterForm ? (
              <motion.div
                key="center-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">새 질문 추가</h2>
                      <p className="text-slate-400 text-sm mt-1">질문을 작성하고 추가하세요</p>
                    </div>
                    <button
                      onClick={() => setShowCenterForm(false)}
                      className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                      aria-label="취소"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <QuestionForm
                    onSubmit={handleCenterFormSubmit}
                    onCancel={() => setShowCenterForm(false)}
                    error={null}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {effectiveReadOnly && !session?.currentQuestion ? (
                  <ClassSummary
                    session={session}
                    participants={participants}
                    leaderboard={leaderboard}
                    count={count}
                  />
                ) : (
                  <MainContent
                    currentMode={currentMode}
                    sessionId={sessionId}
                    session={session}
                    onlineList={onlineList}
                    leaderboard={leaderboard}
                    drawParticipants={drawParticipants}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 0 : 460 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="border-l border-slate-200 bg-white overflow-hidden shrink-0"
        >
        <div className="w-[460px] p-5 space-y-5 overflow-y-auto h-full">
          {effectiveReadOnly ? (
            <>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <span className="text-slate-900 font-bold text-lg">{Object.keys(participants).length}</span>
                <span className="text-slate-400 text-sm">명 참여</span>
              </div>

              {(() => {
                const allParticipants = Object.keys(participants).length;
                const questions = session?.questions || {};
                const voterIds = new Set();
                Object.values(questions).forEach((q) => {
                  if (q.votes) {
                    Object.keys(q.votes).forEach((pid) => voterIds.add(pid));
                  }
                });
                const activeCount = voterIds.size;
                const pct = allParticipants > 0 ? Math.round((activeCount / allParticipants) * 100) : 0;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs font-medium">참여율</span>
                      <span className="text-slate-600 text-xs font-semibold">{activeCount}/{allParticipants}명 활동</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {leaderboard.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <Leaderboard entries={leaderboard} maxShow={5} title="상위 랭킹" />
                </div>
              )}
              <ParticipantList participants={Object.entries(participants).map(([id, data]) => ({ id, ...data }))} />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        </motion.div>
      </div>
    </div>
  );
}
