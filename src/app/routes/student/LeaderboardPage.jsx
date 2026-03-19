import { Trophy, Ticket } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import { useScores } from '@/features/quiz/api/useScores';
import { getParticipantId } from '@/lib/participant';

export default function LeaderboardPage({ sessionId }) {
  const { leaderboard } = useScores(sessionId);
  const participantId = getParticipantId();
  const myRank = leaderboard.findIndex((entry) => entry.id === participantId) + 1;
  const myEntry = myRank > 0 ? leaderboard[myRank - 1] : null;

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />

      <div className="w-full max-w-sm space-y-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <Trophy size={28} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">실시간 순위</h2>
            <p className="text-slate-400 text-sm mt-1">퀴즈와 참여 점수가 누적된 랭킹입니다</p>
          </div>

          {myEntry && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="primary">내 순위 {myRank}위</Badge>
              <Badge variant="neutral">{myEntry.total}점</Badge>
              <Badge variant="warning">
                <Ticket size={12} className="mr-1" />
                {myEntry.tickets || 0}장
              </Badge>
            </div>
          )}
        </div>

        <Leaderboard
          entries={leaderboard}
          maxShow={8}
          title="현재 리더보드"
          highlightId={participantId}
          emptyLabel="아직 점수가 집계되지 않았습니다"
        />
      </div>

      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
}
