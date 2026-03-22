import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, Users, MessageSquare, Play, Settings, Radio } from 'lucide-react';
import JoinToast from '@/features/participants/components/JoinToast';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import QuestionManager from './QuestionManager';
import CenterContent from './CenterContent';
import RightSidebar from './RightSidebar';
import ChatPanel from '@/features/chat/components/ChatPanel';
import TeamBattleControl from '@/features/teams/components/TeamBattleControl';
import ModeSwitcher from './ModeSwitcher';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
              className="h-full overflow-y-auto overscroll-contain p-4 scrollbar-hide">
              <RightSidebar session={s.session} sessionId={s.sessionId} effectiveReadOnly={s.effectiveReadOnly}
                participants={s.participants} onlineList={s.onlineList} count={s.count} leaderboard={s.leaderboard}
                voteCounts={s.voteCounts} studentUrl={s.studentUrl} sidebarCollapsed={false} isDrawer
                teamScores={s.teamScores} />
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
