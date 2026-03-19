import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ref, update, set, serverTimestamp } from 'firebase/database';
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
import { Radio, Loader2, Monitor, Target, Ticket, Trophy, X, Users, Copy, Check, ArrowLeft, ChevronDown, Clock, MessageCircle, PanelLeftClose, PanelLeftOpen, Square, Play, BarChart3, Circle, Cloud, MessageSquare, AlertTriangle, Layers } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import TimerControls from '@/features/timer/components/TimerControls';
import TimerRing from '@/features/timer/components/TimerRing';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import ChatPanel from '@/features/chat/components/ChatPanel';
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

function RightPanelAccordion({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">{title}</span>
          {count > 0 && <span className="text-xs text-slate-400">{count}</span>}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${mins}분 경과`;
  return `${mins}분 경과`;
}

function ElapsedTime({ startedAt, createdAt, status }) {
  const [now, setNow] = useState(Date.now());
  const origin = startedAt || createdAt;

  useEffect(() => {
    if (!origin || status !== 'active') return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [origin, status]);

  if (!origin || status !== 'active') return null;

  const elapsed = Math.max(0, now - origin);
  if (elapsed < 60_000) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <span className="text-slate-200">&middot;</span>
      <Clock size={12} className="text-slate-300" />
      <span>{formatElapsed(elapsed)}</span>
    </span>
  );
}

const QTYPE_META = {
  choice: { label: '객관식', icon: BarChart3 },
  quiz: { label: '퀴즈', icon: Trophy },
  ox: { label: 'O/X', icon: Circle },
  wordcloud: { label: '워드클라우드', icon: Cloud },
  qna: { label: 'Q&A', icon: MessageSquare },
};

function getQuestionInsights(questions, participantCount) {
  const entries = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  return entries.map(([qId, q]) => {
    const votes = q.votes || {};
    const voteCount = Object.keys(votes).length;
    const responseRate = participantCount > 0 ? Math.round((voteCount / participantCount) * 100) : 0;
    const hasCorrectAnswer = Boolean(q.correctAnswer);
    let correctRate = null;
    let correctCount = 0;

    if (hasCorrectAnswer && voteCount > 0) {
      correctCount = Object.values(votes).filter((v) => v.value === q.correctAnswer).length;
      correctRate = Math.round((correctCount / voteCount) * 100);
    }

    return {
      id: qId,
      title: q.title,
      type: q.type,
      voteCount,
      responseRate,
      hasCorrectAnswer,
      correctRate,
      correctCount,
    };
  });
}

function ClassSummary({ session, participants, leaderboard, count }) {
  const questions = session?.questions || {};
  const questionList = Object.values(questions);
  const participantCount = Object.keys(participants).length;
  const voterIds = new Set();
  questionList.forEach((q) => {
    if (q.votes) Object.keys(q.votes).forEach((pid) => voterIds.add(pid));
  });
  const activeCount = voterIds.size;
  const activityRate = participantCount > 0 ? Math.round((activeCount / participantCount) * 100) : 0;
  const topStudent = leaderboard.length > 0 ? leaderboard[0] : null;

  const insights = getQuestionInsights(questions, participantCount);
  const gradedQuestions = insights.filter((q) => q.hasCorrectAnswer && q.correctRate !== null);
  const avgCorrectRate = gradedQuestions.length > 0
    ? Math.round(gradedQuestions.reduce((s, q) => s + q.correctRate, 0) / gradedQuestions.length)
    : null;
  const hardestQuestion = gradedQuestions.length > 0
    ? gradedQuestions.reduce((min, q) => (q.correctRate < min.correctRate ? q : min), gradedQuestions[0])
    : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-slate-900">클래스 요약</h2>
        <p className="text-sm text-slate-400 mt-1">
          {session?.courseName} {session?.roundNumber}차
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{participantCount}</p>
          <p className="text-xs text-slate-400 mt-1">참여자</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{activityRate}%</p>
          <p className="text-xs text-slate-400 mt-1">참여율</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${activityRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          {avgCorrectRate !== null ? (
            <>
              <p className="text-3xl font-bold text-slate-900">{avgCorrectRate}%</p>
              <p className="text-xs text-slate-400 mt-1">평균 정답률</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900">{questionList.length}</p>
              <p className="text-xs text-slate-400 mt-1">질문</p>
            </>
          )}
        </div>
      </div>

      {/* Hardest question callout */}
      {hardestQuestion && hardestQuestion.correctRate < 70 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">가장 어려웠던 질문</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{hardestQuestion.title}</p>
            <p className="text-xs text-slate-500 mt-1">
              정답률 {hardestQuestion.correctRate}% ({hardestQuestion.correctCount}/{hardestQuestion.voteCount}명 정답)
            </p>
          </div>
        </div>
      )}

      {/* Top student */}
      {topStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-600">
            {topStudent.nickname?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">최고의 학생</p>
            <p className="text-base font-bold text-slate-900">{topStudent.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">{topStudent.total}</p>
            <p className="text-xs text-slate-400">점</p>
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">질문별 결과</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {insights.map((q, i) => {
              const meta = QTYPE_META[q.type] || QTYPE_META.qna;
              const Icon = meta.icon;
              return (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{q.voteCount}명 응답</span>
                      {q.hasCorrectAnswer && q.correctRate !== null && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className={`text-xs font-medium ${
                            q.correctRate >= 70 ? 'text-slate-600' : q.correctRate >= 40 ? 'text-slate-500' : 'text-slate-900 font-semibold'
                          }`}>
                            정답률 {q.correctRate}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Response rate bar */}
                  <div className="w-16 shrink-0">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all"
                        style={{ width: `${q.responseRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-300 text-right mt-0.5">{q.responseRate}%</p>
                  </div>
                </div>
              );
            })}
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
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isRunning: timerRunning, endTime, duration, startTimer, stopTimer } = useTimer(sessionId);
  const { pendingAdmins, pendingCount, approveAdmin, rejectAdmin } = useAdminApprovals();

  const isSetting = session?.status === 'setting';
  const isEnded = session?.status === 'ended';

  // Count votes per participant across all questions
  const voteCounts = useMemo(() => {
    const questions = session?.questions;
    if (!questions) return {};
    const counts = {};
    for (const q of Object.values(questions)) {
      if (!q.votes) continue;
      for (const pid of Object.keys(q.votes)) {
        counts[pid] = (counts[pid] || 0) + 1;
      }
    }
    return counts;
  }, [session?.questions]);

  // Question progress for header (hook must be before early returns)
  const questionProgress = useMemo(() => {
    const questions = session?.questions || {};
    const sorted = Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const total = sorted.length;
    if (total === 0) return null;
    const currentQId = session?.currentQuestion;
    const activeIdx = currentQId ? sorted.findIndex(([qId]) => qId === currentQId) : -1;
    return { current: activeIdx >= 0 ? activeIdx + 1 : null, total };
  }, [session?.questions, session?.currentQuestion]);

  // Derive readOnly from session status (ended sessions are always read-only)
  const effectiveReadOnly = readOnly || isEnded;

  // Feature 4: Collapsible sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Feature 5: Center panel question form
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const timerRef = useRef(null);

  // Close timer popup on outside click
  useEffect(() => {
    if (!timerOpen) return;
    function handleClick(e) {
      if (timerRef.current && !timerRef.current.contains(e.target)) setTimerOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [timerOpen]);

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
      await update(ref(db, `sessions/${sessionId}`), { status: 'active', startedAt: serverTimestamp() });
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
    <div className="h-dvh bg-slate-50 flex flex-col overflow-hidden">
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />
      <ChatPanel
        sessionId={sessionId}
        senderName={adminUser?.displayName || '강사'}
        senderType="instructor"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="클래스 목록으로"
          >
            <ArrowLeft size={22} />
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">세션 <span className="font-mono">{sessionId}</span></span>
              {questionProgress && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <span className="text-slate-200">·</span>
                  <Layers size={12} className="text-slate-300" />
                  {questionProgress.current ? (
                    <span>
                      <span className="font-semibold text-slate-600">{questionProgress.current}</span>
                      <span className="text-slate-300">/{questionProgress.total}</span>
                    </span>
                  ) : (
                    <span>{questionProgress.total}개</span>
                  )}
                </span>
              )}
              <ElapsedTime startedAt={session?.startedAt} createdAt={session?.createdAt} status={session?.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Chat button */}
          {!effectiveReadOnly && (
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <MessageCircle size={20} />
              <span className="text-[10px] font-medium">채팅</span>
            </button>
          )}
          {/* Timer button */}
          {!effectiveReadOnly && (
            <div className="relative" ref={timerRef}>
              <button
                onClick={() => setTimerOpen(!timerOpen)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  timerRunning ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {timerRunning ? (
                  <TimerRing endTime={endTime} duration={duration} onExpire={stopTimer} size="sm" />
                ) : (
                  <>
                    <Clock size={20} />
                    <span className="text-[10px] font-medium">타이머</span>
                  </>
                )}
              </button>
              <AnimatePresence>
                {timerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 w-72"
                  >
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">타이머 설정</p>
                    <TimerControls isRunning={timerRunning} onStart={(s) => { startTimer(s); setTimerOpen(false); }} onStop={stopTimer} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <Badge variant="neutral" className="py-2 px-3.5 text-sm">
            <Users size={16} className="mr-1.5" />
            {count}명
          </Badge>
          {totalTickets > 0 && <Badge variant="neutral" className="py-2 px-3.5 text-sm">{totalTickets}장 티켓</Badge>}
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
          animate={{ width: sidebarCollapsed ? 0 : '28%', minWidth: sidebarCollapsed ? 0 : 280 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="border-r border-slate-200 bg-white overflow-hidden shrink-0 min-w-0 max-w-[460px] h-full"
        >
          <div className="min-w-[280px] p-5 overflow-y-auto h-full flex flex-col scrollbar-hide">
            <QuestionManager
              onCollapse={effectiveReadOnly ? undefined : () => setSidebarCollapsed(true)}
              sessionId={sessionId}
              questions={session?.questions || {}}
              currentQuestion={session?.currentQuestion}
              scores={scores}
              participants={participants}
              pendingEvent={null}
              readOnly={effectiveReadOnly}
              formOpen={showCenterForm}
              onAddClick={effectiveReadOnly ? undefined : () => setShowCenterForm(true)}
              onViewQuestion={effectiveReadOnly ? async (qId) => {
                try {
                  if (qId === '__summary__') {
                    await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
                  } else {
                    await update(ref(db, `sessions/${sessionId}`), { currentQuestion: qId, currentMode: 'poll' });
                  }
                } catch {}
              } : undefined}
            />

            {!effectiveReadOnly && (
              <>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setModeOpen(!modeOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500 text-sm font-semibold">모드 전환</p>
                      {isSpecialMode && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {currentMode === 'roulette' ? '돌림판' : currentMode === 'lottery' ? '제비뽑기' : '리더보드'}
                        </span>
                      )}
                    </div>
                    <motion.div animate={{ rotate: modeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} className="text-slate-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {modeOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Center */}
        <div className="flex-1 min-w-0 p-8 overflow-auto relative h-full scrollbar-hide">
          <AnimatePresence mode="wait">
            {showCenterForm ? (
              <motion.div
                key="center-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mx-auto"
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
                className="w-full h-full"
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
          animate={{ width: sidebarCollapsed ? 0 : '28%', minWidth: sidebarCollapsed ? 0 : 280 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="border-l border-slate-200 bg-white overflow-hidden shrink-0 min-w-0 max-w-[460px] h-full"
        >
        <div className="min-w-[280px] p-5 space-y-3 overflow-y-auto h-full scrollbar-hide">
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
                <RightPanelAccordion title="상위 랭킹" count={leaderboard.length} defaultOpen={false}>
                  <Leaderboard entries={leaderboard} maxShow={5} title={null} />
                </RightPanelAccordion>
              )}
              <RightPanelAccordion title="참여자 목록" count={Object.keys(participants).length} defaultOpen>
                <ParticipantList participants={Object.entries(participants).map(([id, data]) => ({ id, ...data }))} voteCounts={voteCounts} />
              </RightPanelAccordion>
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
                        className="h-full bg-slate-700 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Hand raises & urgent questions — always visible, top priority */}
              <HandRaiseList sessionId={sessionId} />
              <UrgentQuestionList sessionId={sessionId} />

              {/* Leaderboard accordion */}
              {leaderboard.length > 0 && (
                <RightPanelAccordion title="상위 랭킹" count={leaderboard.length} defaultOpen={false}>
                  <Leaderboard entries={leaderboard} maxShow={5} title={null} />
                </RightPanelAccordion>
              )}

              {/* Participant list accordion */}
              <RightPanelAccordion title="참여자 목록" count={onlineList.length} defaultOpen>
                <ParticipantList participants={onlineList} voteCounts={voteCounts} />
              </RightPanelAccordion>

              {/* QR */}
              <div className="pt-2">
                <div className="flex justify-center">
                  <QRCode url={studentUrl} size={160} />
                </div>
                <Button onClick={copyStudentLink} variant="secondary" size="sm" className="w-full mt-3">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '링크 복사됨' : '초대 링크 복사'}
                </Button>
                <p className="text-slate-400 text-xs mt-2 text-center break-all leading-relaxed">{studentUrl}</p>
              </div>
            </>
          )}
        </div>
        </motion.div>
      </div>
    </div>
  );
}
