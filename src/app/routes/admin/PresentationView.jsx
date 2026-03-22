import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, X, Copy, Check } from 'lucide-react';
import QRCode from '@/components/ui/QRCode';
import VizRenderer from '@/features/visualization/components/VizRenderer';
import JoinToast from '@/features/participants/components/JoinToast';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';
import Badge from '@/components/ui/Badge';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import TeamScoreboard from '@/features/teams/components/TeamScoreboard';

const Roulette = lazy(() => import('@/features/games/components/Roulette'));
const Lottery = lazy(() => import('@/features/games/components/Lottery'));
const PrizeDraw = lazy(() => import('@/features/games/components/PrizeDraw'));
const SlotMachine = lazy(() => import('@/features/games/components/SlotMachine'));
const Plinko = lazy(() => import('@/features/games/components/Plinko'));
const BreakTimer = lazy(() => import('@/features/games/components/BreakTimer'));

function PresentEmptyState({ sessionId, studentUrl, count }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <QRCode url={studentUrl} size={200} />
      <p className="text-slate-500 dark:text-slate-400 text-base break-all max-w-md text-center">{studentUrl}</p>
      <p className="text-slate-400 dark:text-slate-500 text-sm">학생들이 QR코드를 스캔하여 참여할 수 있습니다</p>
      <div className="flex items-center gap-3">
        <Badge variant="neutral"><Users size={14} className="mr-1" />{count}명 접속 중</Badge>
        <Badge variant="neutral">{sessionId}</Badge>
      </div>
    </div>
  );
}

function PresentQROverlay({ sessionId, studentUrl, count }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function toggle(e) {
    e.stopPropagation();
    setExpanded((v) => !v);
  }

  return (
    <div className="fixed bottom-5 right-5 z-20" onClick={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-5 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">참여 QR코드</span>
              <button
                onClick={toggle}
                className="p-1 rounded-lg text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                aria-label="QR 닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex justify-center">
              <QRCode url={studentUrl} size={180} />
            </div>
            <div className="mt-3 text-center">
              <span className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-wider">{sessionId}</span>
            </div>
            <button
              onClick={handleCopy}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '복사됨' : '링크 복사'}
            </button>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 dark:text-slate-500 text-xs">{count}명 접속 중</span>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={toggle}
            className="flex items-center gap-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 dark:border-slate-700 px-3 py-2.5 hover:shadow-lg transition-shadow group"
            aria-label="QR코드 열기"
          >
            <div className="bg-slate-900 rounded-lg p-1.5">
              <QrCode size={16} className="text-white" />
            </div>
            <div className="text-left">
              <span className="text-slate-900 dark:text-slate-100 text-sm font-bold tracking-wider block leading-tight">{sessionId}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {count}명
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const GameFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
      <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
      <span className="text-sm">준비 중...</span>
    </div>
  </div>
);

// Mode-specific transition variants
function getModeVariants(mode) {
  if (mode === 'leaderboard') {
    return { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 30 } };
  }
  if (['roulette', 'lottery', 'prizeDraw', 'slotMachine', 'plinko', 'breakTime', 'teamBattle'].includes(mode)) {
    return { initial: { opacity: 0, scale: 0.88 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.06 } };
  }
  if (['poll', 'quiz'].includes(mode)) {
    return { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
  }
  return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
}

function MainContent({ currentMode, sessionId, session, onlineList, leaderboard, drawParticipants, presentMode, studentUrl, count, teamScores, scores }) {
  const currentQId = session?.currentQuestion;
  const isActive = ['poll', 'quiz'].includes(currentMode) && currentQId;

  // Determine content + animation key
  let contentKey, content;
  const gameContent = (() => {
    if (currentMode === 'roulette') return <Roulette participants={onlineList} scores={scores} />;
    if (currentMode === 'lottery') return <Lottery participants={drawParticipants} />;
    if (currentMode === 'prizeDraw') return <PrizeDraw participants={onlineList} />;
    if (currentMode === 'slotMachine') return <SlotMachine participants={onlineList} />;
    if (currentMode === 'plinko') return <Plinko participants={onlineList} />;
    if (currentMode === 'breakTime') return <BreakTimer />;
    if (currentMode === 'leaderboard') return <div className="w-full max-w-2xl [&_.max-w-xl]:max-w-2xl"><Leaderboard entries={leaderboard} maxShow={10} title="실시간 리더보드" emptyLabel="아직 점수가 없습니다" /></div>;
    if (currentMode === 'teamBattle') return <div className="w-full max-w-2xl [&_.max-w-lg]:max-w-2xl"><TeamScoreboard teamScores={teamScores || []} /></div>;
    return null;
  })();

  if (gameContent) {
    contentKey = `game-${currentMode}`;
    content = <Suspense fallback={<GameFallback />}>{gameContent}</Suspense>;
  } else if (isActive) {
    contentKey = `question-${currentQId}`;
    content = <div className="w-full [&_.max-w-xl]:max-w-2xl"><VizRenderer sessionId={sessionId} session={session} /></div>;
  } else if (presentMode) {
    contentKey = 'empty';
    content = <PresentEmptyState sessionId={sessionId} studentUrl={studentUrl} count={count} />;
  } else {
    contentKey = 'viz-empty';
    content = <VizRenderer sessionId={sessionId} session={session} />;
  }

  const variants = getModeVariants(gameContent ? currentMode : isActive ? currentMode : 'waiting');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        {...variants}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex-1 flex items-center justify-center w-full"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

export { MainContent };

export default function PresentationView({ sessionId, session, currentMode, onlineList, leaderboard, drawParticipants, studentUrl, count, onExit, teamScores, scores }) {
  const exitPresent = useCallback(() => onExit(), [onExit]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') exitPresent(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exitPresent]);

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-900 relative cursor-pointer" onClick={exitPresent}>
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
          teamScores={teamScores}
          scores={scores}
        />
      </div>
      <PresentQROverlay sessionId={sessionId} studentUrl={studentUrl} count={count} />
      <div className="fixed bottom-5 left-5 flex items-center gap-2">
        <Badge variant="neutral"><Users size={12} className="mr-1" />{count}명</Badge>
      </div>
      <div className="fixed top-5 right-5 bg-slate-900/80 dark:bg-slate-700/80 text-white px-3 py-1.5 rounded-lg text-sm">
        ESC 또는 클릭으로 나가기
      </div>
    </div>
  );
}
