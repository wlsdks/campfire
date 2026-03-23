import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, Users, MessageSquare, Play, Hand, AlertCircle, HelpCircle, Copy, Check, ChevronDown, MoreHorizontal, Target, Ticket, Gift, Dices, CircleDot, Coffee, Trophy, Swords, X, Gamepad2, Activity, UserCircle, Eye, Timer, Award } from 'lucide-react';
import JoinToast from '@/features/participants/components/JoinToast';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import QuestionManager from './QuestionManager';

import CenterContent from './CenterContent';
import ChatPanel from '@/features/chat/components/ChatPanel';
import TeamBattleControl from '@/features/teams/components/TeamBattleControl';
import ModeSwitcher from './ModeSwitcher';
import BottomSheet from '@/components/ui/BottomSheet';
import Avatar from '@/components/ui/Avatar';
import PickMascot from '@/components/ui/PickMascot';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { useClassQuestions } from '@/features/class-questions/api/useClassQuestions';

const TABS = [
  { key: 'progress', label: '진행', icon: Play },
  { key: 'results', label: '결과', icon: BarChart3 },
  { key: 'participants', label: '참여', icon: Users },
  { key: 'chat', label: '채팅', icon: MessageSquare },
];

/* ─── Mode labels ─── */
const MODE_MAP = {
  roulette: { label: '돌림판', icon: Target },
  lottery: { label: '추첨', icon: Ticket },
  prizeDraw: { label: '경품', icon: Gift },
  slotMachine: { label: '777', icon: Dices },
  plinko: { label: '핀볼', icon: CircleDot },
  breakTime: { label: '쉬는시간', icon: Coffee },
  leaderboard: { label: '리더보드', icon: Trophy },
  teamBattle: { label: '팀 대항전', icon: Swords },
};

/* ─── Header ─── */
function MobileHeader({ session, count, onBack, effectiveReadOnly, isSetting, onStartSession, activeTab, onBackToTab, onOpenSettings, isSpecialMode, currentMode, onOpenModes }) {
  const courseName = session?.courseName || 'Pick';
  const round = session?.roundNumber ? `${session.roundNumber}차` : '';
  const isActive = session?.status === 'active' || session?.status === 'reviewing';
  const modeInfo = MODE_MAP[currentMode];

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-800 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={activeTab !== 'progress' ? onBackToTab : onBack} className="p-2 -ml-2 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150" aria-label="뒤로">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">{courseName} {round}</h1>
          <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            <span>{count}명 접속</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isSetting && !effectiveReadOnly && (
          <button onClick={onStartSession}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold transition-colors duration-150 active:scale-[0.96]">
            수업 시작
          </button>
        )}
        {/* Mode indicator — quick access to mode picker */}
        {!effectiveReadOnly && isActive && (
          <motion.button whileTap={{ scale: 0.92 }} onClick={onOpenModes}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              isSpecialMode
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            aria-label="모드 전환"
          >
            {modeInfo ? <modeInfo.icon size={15} /> : <Gamepad2 size={15} />}
            <span className="max-w-[60px] truncate">{modeInfo?.label || '모드'}</span>
          </motion.button>
        )}
        {!effectiveReadOnly && onOpenSettings && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150"
            aria-label="세션 설정">
            <MoreHorizontal size={20} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

/* ─── Mode Picker BottomSheet (grid layout, one-tap switch) ─── */
function MobileModePicker({ open, onClose, currentMode, onSwitchMode, leaderboard, teamBattleActive }) {
  const sections = [
    { title: '수업 도구', modes: [
      { mode: 'comprehension', label: '이해도 체크', icon: Activity },
      { mode: 'quickSurvey', label: '빠른 설문', icon: BarChart3 },
      { mode: 'discussion', label: '그룹 토론', icon: Timer },
      { mode: 'randomPicker', label: '발표자 뽑기', icon: UserCircle },
      { mode: 'focus', label: '집중!', icon: Eye },
    ]},
    { title: '게임 & 이벤트', modes: [
      { mode: 'roulette', label: '돌림판', icon: Target },
      { mode: 'lottery', label: '추첨', icon: Ticket },
      { mode: 'prizeDraw', label: '경품 추첨', icon: Gift },
      { mode: 'slotMachine', label: '777 슬롯', icon: Dices },
      { mode: 'plinko', label: '핀볼', icon: CircleDot },
    ]},
    { title: '기타', modes: [
      { mode: 'breakTime', label: '쉬는 시간', icon: Coffee },
      { mode: 'qaBoard', label: 'Q&A 보드', icon: MessageSquare },
      ...(leaderboard.length > 0 ? [{ mode: 'leaderboard', label: '리더보드', icon: Trophy }] : []),
      ...(teamBattleActive ? [{ mode: 'teamBattle', label: '팀 대항전', icon: Swords }] : []),
      { mode: 'awards', label: '시상식', icon: Award },
    ]},
  ];

  const allModes = sections.flatMap(s => s.modes);
  const isSpecial = allModes.some(m => m.mode === currentMode);

  function ModeButton({ mode, label, icon: Icon }) {
    const isActive = currentMode === mode;
    return (
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => { onSwitchMode(mode); onClose(); }}
        className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl text-center transition-colors duration-150 ${
          isActive
            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
        }`}
      >
        <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-xs font-medium leading-tight">{label}</span>
      </motion.button>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="모드 전환">
      <div className="space-y-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">모드 전환</h3>
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.title}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {section.modes.map(m => <ModeButton key={m.mode} {...m} />)}
            </div>
          </div>
        ))}
        {isSpecial && (
          <button
            onClick={() => { onSwitchMode('waiting'); onClose(); }}
            className="w-full py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-[15px] bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <X size={16} /> 화면 종료
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

/* ─── Bottom Tab Bar (Apple/토스 style: 56px + safe area) ─── */
function MobileTabBar({ activeTab, onTabChange, hasUnreadChat }) {
  return (
    <div className="flex bg-white dark:bg-slate-800 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <motion.button
            key={tab.key}
            whileTap={{ scale: 0.92 }}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors duration-150 relative ${
              isActive
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
            <span>{tab.label}</span>
            {tab.key === 'chat' && hasUnreadChat && (
              <span className="absolute top-2 left-1/2 ml-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Section Accordion (토스 style: 독립 카드, 배경 대비) ─── */
function MobileSection({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors duration-150">
        <span className="flex items-center gap-2.5 text-[16px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          <Icon size={18} className="text-slate-400" />
          {title}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              {count}
            </span>
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-300 dark:text-slate-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Participants Tab (토스 style: hero number, spacious lists) ─── */
function MobileParticipantsTab({ sessionId, onlineList, count, studentUrl }) {
  const { raisedList, count: handCount } = useHandRaises(sessionId);
  const { questionList: urgentList, unreadCount: urgentCount } = useUrgentQuestions(sessionId);
  const { questions: classQuestions, unansweredCount } = useClassQuestions(sessionId);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(studentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full">
      {/* Hero stat */}
      <div className="px-4 pt-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl text-center py-7 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[15px] text-slate-400">실시간 접속</span>
          </div>
          <motion.p key={count} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
            className="text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {count}
          </motion.p>
          <p className="text-[15px] text-slate-400 mt-1">명 접속 중</p>
        </div>
      </div>

      {/* 섹션들 — 독립 카드, 배경 대비로 영역 구분 (토스/당근 패턴) */}
      <div className="px-4 pt-4 pb-8 space-y-3">
        <MobileSection icon={Hand} title="손들기" count={handCount} defaultOpen={handCount > 0}>
          {handCount === 0 ? (
            <p className="text-[15px] text-slate-400 text-center py-4">손든 학생이 없습니다</p>
          ) : (
            <div className="space-y-1">
              {raisedList.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <Avatar name={p.nickname} size="md" />
                  <span className="text-[16px] font-medium text-slate-700 dark:text-slate-200">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </MobileSection>

        <MobileSection icon={AlertCircle} title="긴급 질문" count={urgentCount} defaultOpen={urgentCount > 0}>
          {urgentList.length === 0 ? (
            <p className="text-[15px] text-slate-400 text-center py-4">수신된 질문이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {urgentList.map((q) => (
                <div key={q.id} className={`p-4 rounded-xl ${q.read ? 'bg-slate-50 dark:bg-slate-700/50 opacity-50' : 'bg-slate-50 dark:bg-slate-700'}`}>
                  <p className="text-[16px] text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                  <span className="text-[13px] text-slate-400 mt-2 block">익명</span>
                </div>
              ))}
            </div>
          )}
        </MobileSection>

        <MobileSection icon={HelpCircle} title="수업 질문" count={unansweredCount} defaultOpen={unansweredCount > 0}>
          {classQuestions.length === 0 ? (
            <p className="text-[15px] text-slate-400 text-center py-4">학생 질문이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {classQuestions.slice(0, 10).map((q) => (
                <div key={q.id} className={`p-4 rounded-xl ${q.answered ? 'opacity-50' : 'bg-slate-50 dark:bg-slate-700'}`}>
                  <p className="text-[16px] text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] text-slate-400">{q.nickname}</span>
                    {q.answered && <span className="text-[13px] text-slate-400">답변 완료</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </MobileSection>

        <MobileSection icon={Users} title="참여자" count={onlineList.length}>
          {onlineList.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <PickMascot size="sm" mood="waiting" />
              <p className="text-[15px] text-slate-400">아직 참여자가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {onlineList.map((p) => (
                <div key={p.id} className="flex items-center gap-3.5 py-3.5">
                  <Avatar name={p.nickname} size="md" />
                  <span className="text-[16px] font-medium text-slate-700 dark:text-slate-200 flex-1">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </MobileSection>

        {/* 초대 링크 */}
        <div className="pt-1">
          <button onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-white dark:bg-slate-800 text-[16px] font-medium text-slate-700 dark:text-slate-200 transition-colors duration-150 active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-700">
            {copied ? <><Check size={18} className="text-emerald-500" />복사됨!</> : <><Copy size={18} className="text-slate-400" />초대 링크 복사</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Mobile View ─── */
export default function MobileAdminView({ s }) {
  const [activeTab, setActiveTab] = useState('progress');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);

  const currentMode = s.session?.currentMode;
  const isSpecialMode = ['roulette', 'lottery', 'prizeDraw', 'slotMachine', 'plinko', 'breakTime', 'leaderboard', 'teamBattle', 'qaBoard', 'awards', 'randomPicker', 'comprehension', 'quickSurvey', 'discussion', 'focus'].includes(currentMode);

  const onNewChatMsg = s.handleNewChatMessage;
  const handleNewChatMessage = useCallback(() => {
    if (activeTab !== 'chat') onNewChatMsg();
  }, [activeTab, onNewChatMsg]);

  return (
    <div className="h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <JoinToast sessionId={s.sessionId} />
      <ReactionOverlay sessionId={s.sessionId} />

      <MobileHeader
        session={s.session}
        count={s.count}
        onBack={s.handleBack}
        onStartSession={s.handleStartSession}
        effectiveReadOnly={s.effectiveReadOnly}
        isSetting={s.isSetting}
        activeTab={activeTab}
        onBackToTab={() => setActiveTab('progress')}
        onOpenSettings={() => setSettingsOpen(true)}
        isSpecialMode={isSpecialMode}
        currentMode={currentMode}
        onOpenModes={() => setModesOpen(true)}
      />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto overscroll-contain scrollbar-hide">
              <div className="bg-white dark:bg-slate-800 p-5 space-y-5">
                <QuestionManager
                  sessionId={s.sessionId} questions={s.session?.questions || {}} currentQuestion={s.session?.currentQuestion}
                  scores={s.scores} participants={s.participants} pendingEvent={null} readOnly={s.effectiveReadOnly}
                  formOpen={s.showCenterForm}
                  onAddClick={s.effectiveReadOnly ? undefined : () => { s.handleShowCenterForm(); setActiveTab('results'); }}
                  onViewQuestion={(qId) => { s.handleViewQuestion(qId); setActiveTab('results'); }}
                  adminUid={s.adminUser?.uid}
                  speedQuizActive={s.speedQuizActive} onStartSpeedQuiz={s.startSpeedQuiz} onEndSpeedQuiz={s.endSpeedQuiz} speedQuizCount={s.speedQuizCount}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full flex flex-col overflow-y-auto overscroll-contain scrollbar-hide">
              <div className="bg-white dark:bg-slate-800 flex-1 p-5 flex flex-col">
                <CenterContent showCenterForm={s.showCenterForm} onHideCenterForm={s.handleHideCenterForm} onCenterFormSubmit={s.handleCenterFormSubmit}
                  effectiveReadOnly={s.effectiveReadOnly} session={s.session} currentMode={currentMode} sessionId={s.sessionId}
                  onlineList={s.onlineList} leaderboard={s.leaderboard} drawParticipants={s.drawParticipants}
                  participants={s.participants} scores={s.scores} count={s.count}
                  teamScores={s.teamScores} />
              </div>
            </motion.div>
          )}

          {activeTab === 'participants' && (
            <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto overscroll-contain scrollbar-hide">
              <MobileParticipantsTab sessionId={s.sessionId} onlineList={s.onlineList} count={s.count}
                studentUrl={s.studentUrl} />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full">
              <ChatPanel sessionId={s.sessionId} senderName={s.adminUser?.displayName || '강사'} senderType="instructor"
                open={true} onClose={() => setActiveTab('results')} onNewMessage={handleNewChatMessage}
                inline />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode picker bottom sheet (grid, one-tap) */}
      <MobileModePicker
        open={modesOpen}
        onClose={() => setModesOpen(false)}
        currentMode={currentMode}
        onSwitchMode={(mode) => { s.switchMode(mode); setActiveTab('results'); }}
        leaderboard={s.leaderboard}
        teamBattleActive={s.teamBattleActive}
      />

      {/* Session settings bottom sheet (team battle + mode switcher) */}
      <BottomSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} ariaLabel="세션 설정">
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">세션 설정</h3>
          {(s.session?.status === 'active') && (
            <button onClick={() => { setSettingsOpen(false); setTimeout(() => { if (window.confirm('수업을 종료하시겠습니까?')) s.handleEndSession(); }, 100); }}
              className="w-full py-3 rounded-xl text-red-500 font-medium text-[15px] bg-red-50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors duration-150">
              수업 종료
            </button>
          )}
          {s.isReviewing && (
            <button onClick={() => { setSettingsOpen(false); s.handleFullEndSession(); }}
              className="w-full py-3 rounded-xl text-red-500 font-medium text-[15px] bg-red-50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors duration-150">
              완전 종료
            </button>
          )}
          {s.totalTickets > 0 && (
            <button onClick={() => { if (window.confirm('모든 학습자의 포인트와 티켓을 초기화하시겠습니까?')) { s.resetScores(); setSettingsOpen(false); } }}
              className="w-full py-3 rounded-xl text-slate-500 font-medium text-[15px] bg-slate-50 dark:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors duration-150">
              포인트 · 티켓 초기화
            </button>
          )}
          <ModeSwitcher currentMode={currentMode} isSpecialMode={isSpecialMode} totalTickets={s.totalTickets}
            leaderboard={s.leaderboard} modeOpen={s.modeOpen} onToggle={s.handleModeToggle}
            onSwitchMode={(mode) => { s.switchMode(mode); setSettingsOpen(false); setActiveTab('results'); }}
            teamBattleActive={s.teamBattleActive} />
          <TeamBattleControl
            isActive={s.teamBattleActive}
            teamCount={s.teamBattleCount}
            participantCount={s.count}
            onStart={(count) => { s.startTeamBattle(s.onlineList.map((p) => p.id), count); setSettingsOpen(false); }}
            onEnd={() => { s.endTeamBattle(); setSettingsOpen(false); }}
          />
        </div>
      </BottomSheet>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} hasUnreadChat={s.hasUnreadChat} />
    </div>
  );
}
