import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, Copy, Check } from 'lucide-react';
import ParticipantList from '@/features/participants/components/ParticipantList';
import QRCode from '@/components/ui/QRCode';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import TeamScoreboard from '@/features/teams/components/TeamScoreboard';
import Button from '@/components/ui/Button';

function RightPanelAccordion({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</span>
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

function ActiveRightSidebar({ session, sessionId, count, onlineList, leaderboard, voteCounts, studentUrl, teamScores }) {
  const [copied, setCopied] = useState(false);

  async function copyStudentLink() {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const activeQId = session?.currentQuestion;
  const activeQ = activeQId ? session?.questions?.[activeQId] : null;
  const voted = activeQ?.votes ? Object.keys(activeQ.votes).length : 0;
  const total = count || 0;
  const pct = total > 0 ? Math.round((voted / total) * 100) : 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-900 dark:text-slate-100 font-bold text-lg">{count}</span>
        <span className="text-slate-400 text-sm">명 접속 중</span>
      </div>

      {activeQ && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">참여율</span>
            <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">{voted}/{total}명 투표</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`참여율 ${pct}%`}>
            <div
              className="h-full bg-slate-700 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Hand raises & urgent questions */}
      <HandRaiseList sessionId={sessionId} />
      <UrgentQuestionList sessionId={sessionId} />

      {/* Team scoreboard accordion */}
      {teamScores && teamScores.length > 0 && (
        <RightPanelAccordion title="팀 대항전" count={teamScores.length} defaultOpen>
          <TeamScoreboard teamScores={teamScores} title={null} />
        </RightPanelAccordion>
      )}

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
  );
}

function ReadOnlyRightSidebar({ session, participants, leaderboard, voteCounts }) {
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
    <>
      <div className="flex items-center gap-2">
        <Users size={16} className="text-slate-400" />
        <span className="text-slate-900 dark:text-slate-100 font-bold text-lg">{allParticipants}</span>
        <span className="text-slate-400 text-sm">명 참여</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">참여율</span>
          <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">{activeCount}/{allParticipants}명 활동</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`참여율 ${pct}%`}>
          <div
            className="h-full bg-slate-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {leaderboard.length > 0 && (
        <RightPanelAccordion title="상위 랭킹" count={leaderboard.length} defaultOpen={false}>
          <Leaderboard entries={leaderboard} maxShow={5} title={null} />
        </RightPanelAccordion>
      )}
      <RightPanelAccordion title="참여자 목록" count={Object.keys(participants).length} defaultOpen>
        <ParticipantList participants={Object.entries(participants).map(([id, data]) => ({ id, ...data }))} voteCounts={voteCounts} />
      </RightPanelAccordion>
    </>
  );
}

export default memo(function RightSidebar({
  session,
  sessionId,
  effectiveReadOnly,
  participants,
  onlineList,
  count,
  leaderboard,
  voteCounts,
  studentUrl,
  sidebarCollapsed,
  isDrawer = false,
  teamScores,
}) {
  const content = effectiveReadOnly ? (
    <ReadOnlyRightSidebar
      session={session}
      participants={participants}
      leaderboard={leaderboard}
      voteCounts={voteCounts}
    />
  ) : (
    <ActiveRightSidebar
      session={session}
      sessionId={sessionId}
      count={count}
      onlineList={onlineList}
      leaderboard={leaderboard}
      voteCounts={voteCounts}
      studentUrl={studentUrl}
      teamScores={teamScores}
    />
  );

  // In drawer mode, content is rendered by parent — no wrapper needed
  if (isDrawer) return content;

  return (
    <motion.div
      animate={{ width: sidebarCollapsed ? 0 : '28%', minWidth: sidebarCollapsed ? 0 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 min-w-0 max-w-[460px] h-full"
    >
      <div className="min-w-[280px] p-5 space-y-3 overflow-y-auto h-full scrollbar-hide">
        {content}
      </div>
    </motion.div>
  );
});
