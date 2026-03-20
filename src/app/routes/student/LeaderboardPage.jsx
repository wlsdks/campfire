import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Ticket, Flame, TrendingUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import { useScores } from '@/features/quiz/api/useScores';
import { useMyTeam, useTeamScores } from '@/features/teams/api/useTeamBattle';
import { useTeamBattle } from '@/features/teams/api/useTeamBattle';
import TeamScoreboard from '@/features/teams/components/TeamScoreboard';
import TeamBadge from '@/features/teams/components/TeamBadge';
import { getParticipantId } from '@/lib/participant';

/** Displays the student's own rank summary card at the top. */
function MyRankCard({ rank, entry, total }) {
  if (!entry) return null;

  const pct = total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5"
    >
      {/* Rank number hero */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22, delay: 0.1 }}
        >
          <span className="text-5xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{rank}</span>
          <span className="text-lg font-bold text-slate-400 ml-0.5">위</span>
        </motion.div>
        {total > 1 && (
          <p className="text-xs text-slate-400 mt-1">
            {total}명 중 상위 {pct <= 100 ? pct : 100}%
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Badge variant="primary">
          <Trophy size={12} className="mr-1" />
          {entry.total}점
        </Badge>
        {(entry.tickets || 0) > 0 && (
          <Badge variant="neutral">
            <Ticket size={12} className="mr-1" />
            {entry.tickets}장
          </Badge>
        )}
        {(entry.streak || 0) > 1 && (
          <Badge variant={entry.streak >= 3 ? 'primary' : 'neutral'}>
            <Flame size={12} className="mr-1" />
            {entry.streak}연속 정답
          </Badge>
        )}
        {(entry.bestStreak || 0) > 2 && entry.bestStreak > (entry.streak || 0) && (
          <Badge variant="neutral">
            <TrendingUp size={12} className="mr-1" />
            최고 {entry.bestStreak}연속
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

/** Sticky footer showing own rank when scrolled out of leaderboard view. */
function StickyMyRank({ rank, entry, total }) {
  if (!entry || rank <= 0) return null;

  return (
    <AnimatePresence>
      {rank > 8 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-xl"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md px-4 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {rank}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate block">{entry.nickname}</span>
              <span className="text-xs text-slate-400">{entry.total}점</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">나</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LeaderboardPage({ sessionId }) {
  const { scores, leaderboard } = useScores(sessionId);
  const participantId = getParticipantId();

  const { isActive: teamActive, myTeam } = useMyTeam(sessionId, participantId);
  const { teams } = useTeamBattle(sessionId);
  const teamScores = useTeamScores(teams, scores);

  const { myRank, myEntry } = useMemo(() => {
    const idx = leaderboard.findIndex((entry) => entry.id === participantId);
    return {
      myRank: idx >= 0 ? idx + 1 : 0,
      myEntry: idx >= 0 ? leaderboard[idx] : null,
    };
  }, [leaderboard, participantId]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />

      <div className="w-full space-y-5">
        {/* Team badge */}
        {teamActive && myTeam && (
          <div className="flex justify-center">
            <TeamBadge teamName={myTeam.name} teamColors={myTeam.colors} memberCount={myTeam.memberCount} />
          </div>
        )}

        {/* Team scoreboard */}
        {teamActive && teamScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4"
          >
            <TeamScoreboard teamScores={teamScores} title="팀 대항전" />
          </motion.div>
        )}

        <MyRankCard rank={myRank} entry={myEntry} total={leaderboard.length} />

        <Leaderboard
          entries={leaderboard}
          maxShow={8}
          title="현재 리더보드"
          highlightId={participantId}
          emptyLabel="아직 점수가 집계되지 않았습니다"
        />
      </div>

      <StickyMyRank rank={myRank} entry={myEntry} total={leaderboard.length} />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
