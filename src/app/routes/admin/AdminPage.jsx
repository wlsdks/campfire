import { useState, useCallback, useMemo } from 'react';
import { ref, update, set, serverTimestamp } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useScores } from '@/features/quiz/api/useScores';
import { useAdminApprovals } from '@/features/session/api/useAdminApprovals';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AdminLogin from './AdminLogin';
import SessionDashboard from './SessionDashboard';
import QuestionManager from './QuestionManager';
import QuestionForm from './QuestionForm';
import JoinToast from '@/features/participants/components/JoinToast';
import { Loader2, X, PanelLeftOpen } from 'lucide-react';
import { useTimer } from '@/features/timer/api/useTimer';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import ChatPanel from '@/features/chat/components/ChatPanel';
import { generateQuestionId } from '@/lib/utils';
import { QUIZ_DEFAULTS } from '@/lib/quiz';

import AdminSessionHeader from './AdminSessionHeader';
import ClassSummary from './ClassSummary';
import RightSidebar from './RightSidebar';
import PresentationView, { MainContent } from './PresentationView';
import ModeSwitcher from './ModeSwitcher';

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

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key) || '';
}

function setUrlParams(params) {
  const url = new URL(window.location);
  url.searchParams.delete('s');
  url.searchParams.delete('edit');
  url.searchParams.delete('editName');
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

  // Question progress for header
  const questionProgress = useMemo(() => {
    const questions = session?.questions || {};
    const sorted = Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const total = sorted.length;
    if (total === 0) return null;
    const currentQId = session?.currentQuestion;
    const activeIdx = currentQId ? sorted.findIndex(([qId]) => qId === currentQId) : -1;
    return { current: activeIdx >= 0 ? activeIdx + 1 : null, total };
  }, [session?.questions, session?.currentQuestion]);

  const effectiveReadOnly = readOnly || isEnded;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  // Tablet responsive: < 1024px → overlay drawers instead of fixed sidebars
  const isTablet = useMediaQuery('(max-width: 1023px)');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const isMaster = adminUser?.role === 'master';

  // Memoize student URL so it doesn't create a new string every render
  const studentUrl = useMemo(
    () => `${window.location.origin}/?s=${sessionId}`,
    [sessionId]
  );

  // Memoize drawParticipants (merged online list + scores)
  const drawParticipants = useMemo(
    () => onlineList.map((participant) => ({
      ...participant,
      ...scores[participant.id],
      tickets: scores[participant.id]?.tickets || 0,
    })),
    [onlineList, scores]
  );

  function handleLogin() {
    setAdminUser(getAdminUser());
  }

  function handleSelectSession(id, isReadOnly) {
    setSessionId(id);
    setReadOnly(isReadOnly);
    setUrlParams({ s: id });
  }

  const handleBack = useCallback(() => {
    setSessionId('');
    setReadOnly(false);
    setPresentMode(false);
    setUrlParams({});
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('pinggo_admin');
    setAdminUser(null);
    setSessionId('');
    setUrlParams({});
  }

  // Stabilized callbacks for child components (avoid inline arrow functions)
  const handleChatToggle = useCallback(() => setChatOpen(prev => !prev), []);
  const handleChatClose = useCallback(() => setChatOpen(false), []);
  const handlePresentMode = useCallback(() => setPresentMode(true), []);
  const handleExitPresent = useCallback(() => setPresentMode(false), []);
  const handleModeToggle = useCallback(() => setModeOpen(prev => !prev), []);
  const handleCollapseOpen = useCallback(() => setSidebarCollapsed(false), []);
  const handleCollapseClose = useCallback(() => setSidebarCollapsed(true), []);
  const handleShowCenterForm = useCallback(() => setShowCenterForm(true), []);
  const handleHideCenterForm = useCallback(() => setShowCenterForm(false), []);
  const handleLeftDrawerOpen = useCallback(() => setLeftDrawerOpen(true), []);
  const handleLeftDrawerClose = useCallback(() => setLeftDrawerOpen(false), []);
  const handleRightDrawerOpen = useCallback(() => setRightDrawerOpen(true), []);
  const handleRightDrawerClose = useCallback(() => setRightDrawerOpen(false), []);

  const switchMode = useCallback(async (mode) => {
    if (effectiveReadOnly) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), mode === 'leaderboard'
        ? { currentMode: mode }
        : { currentMode: mode, currentQuestion: null });
    } catch {
      // Silently fail
    }
  }, [sessionId, effectiveReadOnly]);

  const handleStartSession = useCallback(async () => {
    try {
      await update(ref(db, `sessions/${sessionId}`), { status: 'active', startedAt: serverTimestamp() });
    } catch {
      // Silently fail
    }
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
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
  }, [sessionId, handleBack]);

  const handleCenterFormSubmit = useCallback(async ({ type, title, options: cleanOptions, correctAnswer }) => {
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
  }, [sessionId, session?.questions]);

  const handleViewQuestion = useMemo(() => {
    if (!effectiveReadOnly) return undefined;
    return async (qId) => {
      try {
        if (qId === '__summary__') {
          await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
        } else {
          await update(ref(db, `sessions/${sessionId}`), { currentQuestion: qId, currentMode: 'poll' });
        }
      } catch {}
    };
  }, [effectiveReadOnly, sessionId]);

  // 1. Not authenticated
  if (!adminUser) return <AdminLogin onLogin={handleLogin} />;

  // 2. No session selected
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

  // 3. Loading
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

  // 4. Session not found
  if (!session) {
    handleBack();
    return null;
  }

  const currentMode = session?.currentMode;
  const isSpecialMode = ['roulette', 'lottery', 'leaderboard'].includes(currentMode);

  // 5. Presentation mode (full-screen)
  if (presentMode) {
    return (
      <PresentationView
        sessionId={sessionId}
        session={session}
        currentMode={currentMode}
        onlineList={onlineList}
        leaderboard={leaderboard}
        drawParticipants={drawParticipants}
        studentUrl={studentUrl}
        count={count}
        onExit={handleExitPresent}
      />
    );
  }

  // Shared sidebar content — rendered in drawer (tablet) or inline (desktop)
  const leftSidebarContent = (
    <>
      <QuestionManager
        onCollapse={isTablet ? undefined : (effectiveReadOnly ? undefined : handleCollapseClose)}
        sessionId={sessionId}
        questions={session?.questions || {}}
        currentQuestion={session?.currentQuestion}
        scores={scores}
        participants={participants}
        pendingEvent={null}
        readOnly={effectiveReadOnly}
        formOpen={showCenterForm}
        onAddClick={effectiveReadOnly ? undefined : handleShowCenterForm}
        onViewQuestion={handleViewQuestion}
        adminUid={adminUser?.uid}
      />
      {!effectiveReadOnly && (
        <ModeSwitcher
          currentMode={currentMode}
          isSpecialMode={isSpecialMode}
          totalTickets={totalTickets}
          leaderboard={leaderboard}
          modeOpen={modeOpen}
          onToggle={handleModeToggle}
          onSwitchMode={switchMode}
        />
      )}
    </>
  );

  const centerContent = (
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">새 질문 추가</h2>
                <p className="text-slate-400 text-sm mt-1">질문을 작성하고 추가하세요</p>
              </div>
              <button
                onClick={handleHideCenterForm}
                className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                aria-label="취소"
              >
                <X size={20} />
              </button>
            </div>
            <QuestionForm
              onSubmit={handleCenterFormSubmit}
              onCancel={handleHideCenterForm}
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
              scores={scores}
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
  );

  // 6. Main admin layout
  return (
    <div className="h-dvh bg-slate-50 flex flex-col overflow-hidden">
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />
      <ChatPanel
        sessionId={sessionId}
        senderName={adminUser?.displayName || '강사'}
        senderType="instructor"
        open={chatOpen}
        onClose={handleChatClose}
      />

      <AdminSessionHeader
        session={session}
        sessionId={sessionId}
        effectiveReadOnly={effectiveReadOnly}
        isSetting={isSetting}
        questionProgress={questionProgress}
        count={count}
        totalTickets={totalTickets}
        chatOpen={chatOpen}
        onChatToggle={handleChatToggle}
        timerRunning={timerRunning}
        endTime={endTime}
        duration={duration}
        onTimerStart={startTimer}
        onTimerStop={stopTimer}
        onBack={handleBack}
        onStartSession={handleStartSession}
        onEndSession={handleEndSession}
        onPresentMode={handlePresentMode}
        isTablet={isTablet}
        onLeftDrawer={handleLeftDrawerOpen}
        onRightDrawer={handleRightDrawerOpen}
      />

      {/* Tablet overlay drawers */}
      {isTablet && (
        <>
          {/* Left drawer (질문 목록) */}
          <AnimatePresence>
            {leftDrawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/30 z-40"
                  onClick={handleLeftDrawerClose}
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed inset-y-0 left-0 z-50 w-[340px] max-w-[85vw] bg-white shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                    <span className="text-sm font-bold text-slate-900">질문 관리</span>
                    <button
                      onClick={handleLeftDrawerClose}
                      className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                      aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
                    {leftSidebarContent}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Right drawer (참여자/상호작용) */}
          <AnimatePresence>
            {rightDrawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/30 z-40"
                  onClick={handleRightDrawerClose}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed inset-y-0 right-0 z-50 w-[340px] max-w-[85vw] bg-white shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                    <span className="text-sm font-bold text-slate-900">참여자 · 상호작용</span>
                    <button
                      onClick={handleRightDrawerClose}
                      className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                      aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
                    <RightSidebar
                      session={session}
                      sessionId={sessionId}
                      effectiveReadOnly={effectiveReadOnly}
                      participants={participants}
                      onlineList={onlineList}
                      count={count}
                      leaderboard={leaderboard}
                      voteCounts={voteCounts}
                      studentUrl={studentUrl}
                      sidebarCollapsed={false}
                      isDrawer
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop only: Left sidebar collapse toggle (visible when collapsed) */}
        {!isTablet && (
          <AnimatePresence>
            {sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                onClick={handleCollapseOpen}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-200 border-l-0 rounded-r-xl p-3 shadow-md text-slate-400 hover:text-slate-700 transition-all active:scale-95"
                aria-label="사이드바 열기"
              >
                <PanelLeftOpen size={22} />
              </motion.button>
            )}
          </AnimatePresence>
        )}

        {/* Desktop only: Left sidebar (inline) */}
        {!isTablet && (
          <motion.div
            animate={{ width: sidebarCollapsed ? 0 : '28%', minWidth: sidebarCollapsed ? 0 : 280 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="border-r border-slate-200 bg-white overflow-hidden shrink-0 min-w-0 max-w-[460px] h-full"
          >
            <div className="min-w-[280px] p-5 overflow-y-auto h-full scrollbar-hide">
              {leftSidebarContent}
            </div>
          </motion.div>
        )}

        {/* Center */}
        <div className={`flex-1 min-w-0 overflow-auto relative h-full scrollbar-hide ${isTablet ? 'p-4' : 'p-8'}`}>
          {centerContent}
        </div>

        {/* Desktop only: Right sidebar (inline) */}
        {!isTablet && (
          <RightSidebar
            session={session}
            sessionId={sessionId}
            effectiveReadOnly={effectiveReadOnly}
            participants={participants}
            onlineList={onlineList}
            count={count}
            leaderboard={leaderboard}
            voteCounts={voteCounts}
            studentUrl={studentUrl}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
      </div>
    </div>
  );
}
