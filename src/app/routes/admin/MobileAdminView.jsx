import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, Users, MessageSquare, Play, Hand, AlertCircle, HelpCircle, Copy, Check, ChevronDown } from 'lucide-react';
import JoinToast from '@/features/participants/components/JoinToast';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import QuestionManager from './QuestionManager';
import CenterContent from './CenterContent';
import ChatPanel from '@/features/chat/components/ChatPanel';
import TeamBattleControl from '@/features/teams/components/TeamBattleControl';
import ModeSwitcher from './ModeSwitcher';
import ConfirmModal from '@/components/ui/ConfirmModal';
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

function MobileHeader({ session, count, onBack, onEndSession, isReviewing, onFullEndSession, effectiveReadOnly, isSetting, onStartSession }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const courseName = session?.courseName || 'Pick';
  const round = session?.roundNumber ? `${session.roundNumber}차` : '';
  const isActive = session?.status === 'active' || session?.status === 'reviewing';

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150" aria-label="뒤로">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">{courseName} {round}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              <span>{count}명 접속</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isSetting && !effectiveReadOnly && (
            <button onClick={onStartSession}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium transition-colors duration-150 active:scale-[0.96]">
              시작
            </button>
          )}
          {isActive && !effectiveReadOnly && (
            <button onClick={() => setConfirmEnd(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors duration-150 active:scale-[0.96]">
              종료
            </button>
          )}
          {isReviewing && (
            <button onClick={onFullEndSession}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors duration-150 active:scale-[0.96]">
              완전 종료
            </button>
          )}
        </div>
      </div>
      <ConfirmModal open={confirmEnd} onCancel={() => setConfirmEnd(false)} onConfirm={() => { setConfirmEnd(false); onEndSession(); }}
        title="수업을 종료하시겠습니까?" description="학생들에게 요약 카드가 표시됩니다." confirmLabel="종료" variant="danger" />
    </>
  );
}

function MobileTabBar({ activeTab, onTabChange, hasUnreadChat }) {
  return (
    <div className="flex bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors duration-150 relative ${
              isActive
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span>{tab.label}</span>
            {tab.key === 'chat' && hasUnreadChat && (
              <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function MobileSection({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors duration-150 active:bg-slate-50 dark:active:bg-slate-700">
        <span className="flex items-center gap-2.5 text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          <Icon size={18} className="text-slate-400" />
          {title}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              {count}
            </span>
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-400" />
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

function MobileParticipantsTab({ sessionId, onlineList, count, studentUrl, voteCounts }) {
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
    <div className="px-5 py-6 space-y-4">
      {/* Hero stat */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-400">실시간 접속</span>
        </div>
        <motion.p key={count} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
          className="text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
          {count}
        </motion.p>
        <p className="text-sm text-slate-400 mt-1">명 접속 중</p>
      </div>

      {/* Sections */}
      <MobileSection icon={Hand} title="손들기" count={handCount} defaultOpen={handCount > 0}>
        {handCount === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">손든 학생이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {raisedList.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <Avatar name={p.nickname} size="md" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </MobileSection>

      <MobileSection icon={AlertCircle} title="긴급 질문" count={urgentCount} defaultOpen={urgentCount > 0}>
        {urgentList.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">수신된 질문이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {urgentList.map((q) => (
              <div key={q.id} className={`p-3.5 rounded-xl text-sm ${q.read ? 'bg-slate-50 dark:bg-slate-700/50 opacity-50' : 'bg-slate-50 dark:bg-slate-700'}`}>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                <span className="text-xs text-slate-400 mt-1.5 block">익명</span>
              </div>
            ))}
          </div>
        )}
      </MobileSection>

      <MobileSection icon={HelpCircle} title="수업 질문" count={unansweredCount} defaultOpen={unansweredCount > 0}>
        {classQuestions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">학생 질문이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {classQuestions.slice(0, 10).map((q) => (
              <div key={q.id} className={`p-3.5 rounded-xl text-sm ${q.answered ? 'opacity-50' : 'bg-slate-50 dark:bg-slate-700'}`}>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{q.nickname}</span>
                  {q.answered && <span className="text-xs text-slate-400">답변 완료</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </MobileSection>

      <MobileSection icon={Users} title="참여자 목록" count={onlineList.length}>
        {onlineList.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <PickMascot size="sm" mood="waiting" />
            <p className="text-sm text-slate-400">아직 참여자가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1">
            {onlineList.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={p.nickname} size="md" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{p.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </MobileSection>

      {/* Invite link */}
      <div className="pt-2">
        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors duration-150 active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-700">
          {copied ? <><Check size={16} className="text-emerald-500" />복사됨!</> : <><Copy size={16} className="text-slate-400" />초대 링크 복사</>}
        </button>
      </div>
    </div>
  );
}

export default function MobileAdminView({ s }) {
  const [activeTab, setActiveTab] = useState('progress');

  const currentMode = s.session?.currentMode;
  const isSpecialMode = ['roulette', 'lottery', 'prizeDraw', 'leaderboard', 'teamBattle'].includes(currentMode);

  const handleNewChatMessage = useCallback(() => {
    if (activeTab !== 'chat') s.handleNewChatMessage();
  }, [activeTab, s.handleNewChatMessage]);

  return (
    <div className="h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <JoinToast sessionId={s.sessionId} />
      <ReactionOverlay sessionId={s.sessionId} />

      <MobileHeader
        session={s.session}
        count={s.count}
        onBack={s.handleBack}
        onEndSession={s.handleEndSession}
        onStartSession={s.handleStartSession}
        isReviewing={s.isReviewing}
        onFullEndSession={s.handleFullEndSession}
        effectiveReadOnly={s.effectiveReadOnly}
        isSetting={s.isSetting}
      />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto overscroll-contain p-4 space-y-4 scrollbar-hide">
              <QuestionManager
                sessionId={s.sessionId} questions={s.session?.questions || {}} currentQuestion={s.session?.currentQuestion}
                scores={s.scores} participants={s.participants} pendingEvent={null} readOnly={s.effectiveReadOnly}
                formOpen={s.showCenterForm} onAddClick={s.effectiveReadOnly ? undefined : s.handleShowCenterForm}
                onViewQuestion={(qId) => { s.handleViewQuestion(qId); setActiveTab('results'); }}
                adminUid={s.adminUser?.uid}
                speedQuizActive={s.speedQuizActive} onStartSpeedQuiz={s.startSpeedQuiz} onEndSpeedQuiz={s.endSpeedQuiz} speedQuizCount={s.speedQuizCount}
              />
              {!s.effectiveReadOnly && (
                <>
                  <TeamBattleControl
                    isActive={s.teamBattleActive}
                    teamCount={s.teamBattleCount}
                    participantCount={s.count}
                    onStart={(count) => s.startTeamBattle(s.onlineList.map((p) => p.id), count)}
                    onEnd={s.endTeamBattle}
                  />
                  <ModeSwitcher currentMode={currentMode} isSpecialMode={isSpecialMode} totalTickets={s.totalTickets}
                    leaderboard={s.leaderboard} modeOpen={s.modeOpen} onToggle={s.handleModeToggle} onSwitchMode={s.switchMode}
                    teamBattleActive={s.teamBattleActive} />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto overscroll-contain p-4 scrollbar-hide">
              <CenterContent showCenterForm={s.showCenterForm} onHideCenterForm={s.handleHideCenterForm} onCenterFormSubmit={s.handleCenterFormSubmit}
                effectiveReadOnly={s.effectiveReadOnly} session={s.session} currentMode={currentMode} sessionId={s.sessionId}
                onlineList={s.onlineList} leaderboard={s.leaderboard} drawParticipants={s.drawParticipants}
                participants={s.participants} scores={s.scores} count={s.count}
                teamScores={s.teamScores} />
            </motion.div>
          )}

          {activeTab === 'participants' && (
            <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto overscroll-contain scrollbar-hide">
              <MobileParticipantsTab sessionId={s.sessionId} onlineList={s.onlineList} count={s.count}
                studentUrl={s.studentUrl} voteCounts={s.voteCounts} />
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

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} hasUnreadChat={s.hasUnreadChat} />
    </div>
  );
}
