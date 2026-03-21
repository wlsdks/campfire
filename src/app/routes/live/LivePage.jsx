import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/features/session/api/useSession';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { useTimer } from '@/features/timer/api/useTimer';
import { useVotes } from '@/hooks/useVotes';
import { useScores } from '@/features/quiz/api/useScores';
import { useTeamBattle } from '@/features/teams/api/useTeamBattle';
import { useTeamScores } from '@/features/teams/api/useTeamBattle';
import VizRenderer from '@/features/visualization/components/VizRenderer';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import JoinToast from '@/features/participants/components/JoinToast';
import TimerCountdown from '@/features/timer/components/TimerCountdown';
import Badge from '@/components/ui/Badge';
import PickMascot from '@/components/ui/PickMascot';
import LiveHeader from './LiveHeader';
import LiveParticipation from './LiveParticipation';

const Roulette = lazy(() => import('@/features/games/components/Roulette'));
const Lottery = lazy(() => import('@/features/games/components/Lottery'));
const PrizeDraw = lazy(() => import('@/features/games/components/PrizeDraw'));
const Leaderboard = lazy(() => import('@/features/quiz/components/Leaderboard'));
const TeamScoreboard = lazy(() => import('@/features/teams/components/TeamScoreboard'));

const GameFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex items-center gap-2 text-slate-400">
      <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
      <span className="text-sm">준비 중...</span>
    </div>
  </div>
);

export default function LivePage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('s');
  const { session, loading } = useSession(sessionId);
  const { onlineList, count } = useParticipants(sessionId);
  const { isRunning, endTime, duration } = useTimer(sessionId);
  const { scores, leaderboard } = useScores(sessionId);
  const { teams } = useTeamBattle(sessionId);
  const teamScores = useTeamScores(teams, scores);

  const currentQId = session?.currentQuestion;
  const currentMode = session?.currentMode;
  const question = currentQId ? session?.questions?.[currentQId] : null;
  const { totalVotes } = useVotes(sessionId, currentQId);

  const isGameMode = ['roulette', 'lottery', 'prizeDraw', 'leaderboard', 'teamBattle'].includes(currentMode);
  const isEnded = session?.status === 'ended';
  const hasActiveQuestion = ['poll', 'quiz'].includes(currentMode) && currentQId && question;

  // Force dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  // No session ID provided
  if (!sessionId) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <PickMascot size="lg" mood="thinking" />
          <p className="text-slate-400 text-sm">세션 ID가 없습니다</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  // Session ended
  if (isEnded) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center space-y-5"
        >
          <PickMascot size="lg" mood="happy" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">수업이 종료되었습니다</h1>
          <p className="text-slate-400 text-sm">참여해 주셔서 감사합니다</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-slate-900 flex flex-col overflow-hidden">
      <LiveHeader courseName={session?.courseName} roundNumber={session?.roundNumber} count={count} />
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />

      <div className="flex-1 flex items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {isGameMode ? (
              <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full">
                <Suspense fallback={<GameFallback />}>
                  {currentMode === 'roulette' && <Roulette participants={onlineList} />}
                  {currentMode === 'lottery' && <Lottery participants={onlineList} />}
                  {currentMode === 'prizeDraw' && <PrizeDraw participants={onlineList} />}
                  {currentMode === 'leaderboard' && <Leaderboard entries={leaderboard} maxShow={10} title="실시간 리더보드" />}
                  {currentMode === 'teamBattle' && <TeamScoreboard teamScores={teamScores || []} />}
                </Suspense>
              </motion.div>
            ) : hasActiveQuestion ? (
              <motion.div key="question" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="w-full space-y-6">
                {isRunning && endTime && (
                  <div className="max-w-xl mx-auto">
                    <TimerCountdown endTime={endTime} duration={duration} />
                  </div>
                )}

                <div className="w-full">
                  <VizRenderer sessionId={sessionId} session={session} />
                </div>

                <LiveParticipation voted={totalVotes} total={count} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="text-center space-y-5">
                <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <PickMascot size="lg" mood="waiting" />
                </motion.div>
                <h2 className="text-xl font-semibold text-slate-300 tracking-tight">
                  다음 질문을 기다리는 중...
                </h2>
                <Badge variant="neutral" className="!bg-slate-700 !text-slate-400">
                  {count}명 접속 중
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
