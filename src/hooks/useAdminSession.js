import { useState, useCallback, useMemo } from 'react';
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useScores } from '@/features/quiz/api/useScores';
import { useAdminApprovals } from '@/features/session/api/useAdminApprovals';
import { useTimer } from '@/features/timer/api/useTimer';
import { useSpeedQuiz } from '@/features/quiz/api/useSpeedQuiz';
import { useTeamBattle, useTeamScores } from '@/features/teams/api/useTeamBattle';
import { useQuestionActions } from '@/hooks/useQuestionActions';

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

export function useAdminSession() {
  const [adminUser, setAdminUser] = useState(() => getAdminUser());
  const [sessionId, setSessionId] = useState(() => getUrlParam('s'));
  const [readOnly, setReadOnly] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const { session, loading } = useSession(sessionId);
  const { participants, onlineList, count } = useParticipants(sessionId);
  const { scores, leaderboard, totalTickets } = useScores(sessionId);
  const { isRunning: timerRunning, endTime, duration, startTimer, stopTimer } = useTimer(sessionId);
  const { pendingAdmins, pendingCount, approveAdmin, rejectAdmin } = useAdminApprovals();

  const { active: speedQuizActive, startSpeedQuiz, endSpeedQuiz, quizCount: speedQuizCount } = useSpeedQuiz(
    sessionId, session, { scores, participants, startTimer, stopTimer }
  );

  const { isActive: teamBattleActive, teamCount: teamBattleCount, teams, startTeamBattle, endTeamBattle } = useTeamBattle(sessionId);
  const teamScores = useTeamScores(teams, scores);

  const { handleSubmit: submitQuestion } = useQuestionActions(sessionId, session?.questions || {}, session?.currentQuestion, scores, participants);

  const isSetting = session?.status === 'setting';
  const isReviewing = session?.status === 'reviewing';
  const isEnded = session?.status === 'ended';
  const effectiveReadOnly = readOnly || isEnded || isReviewing;
  const isMaster = adminUser?.role === 'master';

  const voteCounts = useMemo(() => {
    const questions = session?.questions;
    if (!questions) return {};
    const counts = {};
    for (const q of Object.values(questions)) {
      if (!q.votes) continue;
      for (const pid of Object.keys(q.votes)) { counts[pid] = (counts[pid] || 0) + 1; }
    }
    return counts;
  }, [session?.questions]);

  const questionProgress = useMemo(() => {
    const questions = session?.questions || {};
    const sorted = Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const total = sorted.length;
    if (total === 0) return null;
    const currentQId = session?.currentQuestion;
    const activeIdx = currentQId ? sorted.findIndex(([qId]) => qId === currentQId) : -1;
    return { current: activeIdx >= 0 ? activeIdx + 1 : null, total };
  }, [session?.questions, session?.currentQuestion]);

  const studentUrl = useMemo(() => `${window.location.origin}/?s=${sessionId}`, [sessionId]);
  const drawParticipants = useMemo(
    () => onlineList.map((p) => ({ ...p, ...scores[p.id], tickets: scores[p.id]?.tickets || 0 })),
    [onlineList, scores]
  );

  // Navigation
  function handleLogin() { setAdminUser(getAdminUser()); }
  function handleSelectSession(id, isReadOnly) { setSessionId(id); setReadOnly(isReadOnly); setUrlParams({ s: id }); }
  const handleBack = useCallback(() => { setSessionId(''); setReadOnly(false); setPresentMode(false); setUrlParams({}); }, []);
  function handleLogout() { sessionStorage.removeItem('pinggo_admin'); setAdminUser(null); setSessionId(''); setUrlParams({}); }

  // UI toggles
  const handleChatToggle = useCallback(() => {
    setChatOpen(prev => !prev);
    setHasUnreadChat(false);
  }, []);
  const handleChatClose = useCallback(() => setChatOpen(false), []);
  const handleNewChatMessage = useCallback(() => {
    if (!chatOpen) setHasUnreadChat(true);
  }, [chatOpen]);
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

  // Session actions
  const switchMode = useCallback(async (mode) => {
    if (effectiveReadOnly) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), mode === 'leaderboard'
        ? { currentMode: mode } : { currentMode: mode, currentQuestion: null });
    } catch {}
  }, [sessionId, effectiveReadOnly]);

  const handleStartSession = useCallback(async () => {
    try { await update(ref(db, `sessions/${sessionId}`), { status: 'active', startedAt: serverTimestamp() }); } catch {}
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
    if (!window.confirm('수업을 종료하시겠습니까?\n학생들은 결과를 확인하고, 질문을 보낼 수 있습니다.\n14일 후 자동으로 완전 종료됩니다.')) return;
    try {
      const reviewingUntil = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
      await update(ref(db, `sessions/${sessionId}`), {
        status: 'reviewing',
        currentMode: 'waiting',
        currentQuestion: null,
        reviewingUntil,
      });
    } catch {}
  }, [sessionId]);

  const handleFullEndSession = useCallback(async () => {
    if (!window.confirm('완전 종료하시겠습니까?\n학생들은 더 이상 질문을 보낼 수 없습니다.')) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), { status: 'ended' });
    } catch {}
  }, [sessionId]);

  const handleCenterFormSubmit = useCallback(async (formData) => {
    const success = await submitQuestion(formData);
    if (success) setShowCenterForm(false);
    return success;
  }, [submitQuestion]);

  const handleViewQuestion = useMemo(() => {
    if (!effectiveReadOnly) return undefined;
    return async (qId) => {
      try {
        if (qId === '__summary__') { await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' }); }
        else { await update(ref(db, `sessions/${sessionId}`), { currentQuestion: qId, currentMode: 'poll' }); }
      } catch {}
    };
  }, [effectiveReadOnly, sessionId]);

  return {
    // Auth
    adminUser, isMaster, handleLogin, handleLogout,
    // Session
    sessionId, session, loading, readOnly, effectiveReadOnly, isSetting, isReviewing, isEnded,
    handleSelectSession, handleBack, handleStartSession, handleEndSession, handleFullEndSession,
    // Approvals
    pendingAdmins, pendingCount, approveAdmin, rejectAdmin,
    // Participants & scores
    participants, onlineList, count, scores, leaderboard, totalTickets,
    voteCounts, drawParticipants, studentUrl, questionProgress,
    // Timer
    timerRunning, endTime, duration, startTimer, stopTimer,
    // Speed quiz
    speedQuizActive, startSpeedQuiz, endSpeedQuiz, speedQuizCount,
    // Team battle
    teamBattleActive, teamBattleCount, teams, teamScores, startTeamBattle, endTeamBattle,
    // UI state
    presentMode, chatOpen, sidebarCollapsed, showCenterForm, modeOpen,
    leftDrawerOpen, rightDrawerOpen,
    // UI handlers
    handleChatToggle, handleChatClose, handleNewChatMessage, hasUnreadChat,
    handlePresentMode, handleExitPresent,
    handleModeToggle, switchMode,
    handleCollapseOpen, handleCollapseClose,
    handleShowCenterForm, handleHideCenterForm,
    handleLeftDrawerOpen, handleLeftDrawerClose,
    handleRightDrawerOpen, handleRightDrawerClose,
    // Question form
    handleCenterFormSubmit, handleViewQuestion,
  };
}
