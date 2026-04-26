import { useState, useCallback, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import DrumrollOverlay from '@/components/ui/DrumrollOverlay';
import { isQuizQuestion } from '@/lib/quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, X, Copy, Check, Hand, MessageSquare, ChevronDown, ChevronLeft, ChevronRight, Eye, Trophy } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import PickMascot from '@/components/ui/PickMascot';
import QRCode from '@/components/ui/QRCode';
import VizRenderer from '@/features/visualization/components/VizRenderer';
import JoinToast from '@/features/participants/components/JoinToast';
import HandRaiseList from '@/features/hand-raise/components/HandRaiseList';
import UrgentQuestionList from '@/features/questions/components/UrgentQuestionList';
import Badge from '@/components/ui/Badge';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import ChatBubbleOverlay from '@/features/reactions/components/ChatBubbleOverlay';
import AnswerBubbleOverlay from '@/features/voting/components/AnswerBubbleOverlay';
import { usePublishGameResult } from '@/features/games/api/useGameResult';
import Leaderboard from '@/features/quiz/components/Leaderboard';
import PersistentAssignmentBar from '@/features/ai-judge/components/PersistentAssignmentBar';
import { useQuestionActions } from '@/hooks/useQuestionActions';

const Lottery = lazy(() => import('@/features/games/components/Lottery'));
const BreakTimer = lazy(() => import('@/features/games/components/BreakTimer'));
const ClassQABoard = lazy(() => import('@/features/class-questions/components/ClassQABoard'));
const AwardsCeremony = lazy(() => import('@/features/assignments/components/AwardsCeremony'));
const RandomPicker = lazy(() => import('@/features/games/components/RandomPicker'));
const ComprehensionPresenter = lazy(() => import('@/features/session/components/ComprehensionCheck').then(m => ({ default: m.ComprehensionPresenter })));
const SurveyPresenter = lazy(() => import('@/features/session/components/QuickSurvey').then(m => ({ default: m.SurveyPresenter })));
const DiscussionPresenter = lazy(() => import('@/features/session/components/DiscussionPresenter'));
const CombinedRanking = lazy(() => import('@/features/quiz/components/CombinedRanking'));
const QARanking = lazy(() => import('@/features/class-questions/components/QARanking'));
const JoinShow = lazy(() => import('@/features/games/components/JoinShow'));

function PresentEmptyState({ sessionId, studentUrl, count }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 md:gap-6 px-2">
      <QRCode url={studentUrl} size={180} />
      <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base break-all max-w-xs md:max-w-md text-center">{studentUrl}</p>
      <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm text-center">학생들이 QR코드를 스캔하여 참여할 수 있습니다</p>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
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
    <div className="fixed bottom-3 right-3 md:bottom-5 md:right-5 z-20" onClick={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 md:p-5 w-56 md:w-64"
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
              <QRCode url={studentUrl} size={160} />
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
            className="flex items-center gap-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 hover:shadow-lg transition-shadow group"
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
  if (['lottery', 'breakTime', 'awards', 'randomPicker', 'comprehension', 'quickSurvey', 'discussion', 'focus', 'combinedRanking', 'qaRanking', 'joinShow'].includes(mode)) {
    return { initial: { opacity: 0, scale: 0.88 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.06 } };
  }
  if (['poll', 'quiz'].includes(mode)) {
    return { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
  }
  return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
}

function MainContent({ currentMode, sessionId, session, onlineList, leaderboard, drawParticipants, presentMode, studentUrl, count, scores, onGameResult }) {
  const currentQId = session?.currentQuestion;
  const isActive = ['poll', 'quiz'].includes(currentMode) && currentQId;

  // Determine content + animation key
  let contentKey, content;
  const gameContent = (() => {
    if (currentMode === 'lottery') return (
      <Lottery participants={drawParticipants} onResult={(names) => onGameResult?.(names, 'lottery')} />
    );
    if (currentMode === 'breakTime') return <BreakTimer />;
    if (currentMode === 'leaderboard') return <div className="w-full max-w-xl md:max-w-2xl [&_.max-w-xl]:max-w-2xl px-2 md:px-0"><Leaderboard entries={leaderboard} maxShow={10} title="실시간 리더보드" emptyLabel="아직 점수가 없습니다" /></div>;
    if (currentMode === 'qaBoard') return <div className="w-full max-w-4xl"><ClassQABoard sessionId={sessionId} showInput={false} isAdmin /></div>;
    if (currentMode === 'qaRanking') return <QARanking sessionId={sessionId} />;
    if (currentMode === 'joinShow') return <JoinShow sessionId={sessionId} />;
    if (currentMode === 'awards') return <AwardsCeremony assignmentId={session?.activeAssignmentId} />;
    if (currentMode === 'randomPicker') return <RandomPicker participants={onlineList} />;
    if (currentMode === 'comprehension') return <ComprehensionPresenter sessionId={sessionId} />;
    if (currentMode === 'quickSurvey') return <SurveyPresenter sessionId={sessionId} />;
    if (currentMode === 'discussion') return <DiscussionPresenter sessionId={sessionId} />;
    if (currentMode === 'combinedRanking') return <CombinedRanking session={session} />;
    if (currentMode === 'focus') return (
      <div className="flex flex-col items-center justify-center gap-4 md:gap-6 text-center">
        <PickMascot size="lg" mood="focus" />
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">집중 모드</p>
        <p className="text-slate-400 dark:text-white/40 text-sm md:text-lg">학생 화면이 잠겼습니다</p>
      </div>
    );
    return null;
  })();

  if (gameContent) {
    contentKey = `game-${currentMode}`;
    content = <Suspense fallback={<GameFallback />}>{gameContent}</Suspense>;
  } else if (isActive) {
    contentKey = `question-${currentQId}`;
    content = <div className="w-full px-2 md:px-0 [&_.max-w-xl]:max-w-3xl [&_.max-w-md]:max-w-xl"><VizRenderer sessionId={sessionId} session={session} isAdmin isPresenter={presentMode} /></div>;
  } else if (presentMode) {
    contentKey = 'empty';
    content = <PresentEmptyState sessionId={sessionId} studentUrl={studentUrl} count={count} />;
  } else {
    contentKey = 'viz-empty';
    content = <VizRenderer sessionId={sessionId} session={session} isAdmin />;
  }

  const variants = getModeVariants(gameContent ? currentMode : isActive ? currentMode : 'waiting');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        {...variants}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`flex-1 flex justify-center w-full ${contentKey === 'game-qaBoard' ? 'items-start overflow-y-auto' : 'items-center'}`}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

export { MainContent };

/** Collapsible panel for HandRaiseList + UrgentQuestionList — always toggleable. */
function SideNoticesPanel({ sessionId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop: toggleable top-left panel */}
      <div className="hidden md:block fixed top-5 left-5 z-10">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-medium shadow-lg mb-2"
          aria-label="알림 패널 열기/닫기"
        >
          <Hand size={13} />
          <MessageSquare size={13} />
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </motion.button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="w-72 space-y-3"
            >
              <HandRaiseList sessionId={sessionId} />
              <UrgentQuestionList sessionId={sessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: pill toggle at top-left + slide-down sheet */}
      <div className="md:hidden fixed top-3 left-3 z-20">
        <motion.button
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-medium shadow-lg"
          aria-label="알림 패널 열기"
        >
          <Hand size={13} />
          <MessageSquare size={13} />
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-[min(calc(100vw-24px),288px)] space-y-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3"
            >
              <HandRaiseList sessionId={sessionId} />
              <UrgentQuestionList sessionId={sessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/** Exit hint + button — ESC on desktop, explicit button on all. */
function ExitHint({ onExit }) {
  return (
    <button
      onClick={onExit}
      className="fixed top-3 right-3 md:top-5 md:right-5 bg-slate-900/80 dark:bg-slate-700/80 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-150 z-20 flex items-center gap-1.5 shadow-lg hover:shadow-xl active:scale-95"
    >
      <X size={14} />
      <span className="hidden sm:inline">나가기</span>
      <span className="hidden md:inline text-white/50 ml-1">ESC</span>
    </button>
  );
}

export function PresentRevealControls({ sessionId, session, onRevealQuiz, onRevealAnswer }) {
  const [drumroll, setDrumroll] = useState(false);
  const currentQId = session?.currentQuestion;
  const question = currentQId ? session?.questions?.[currentQId] : null;
  if (!question) return null;

  // 퀴즈도 발표 모드에서 두구두구/정답 공개 가능. 단, 퀴즈는 점수 반영(revealQuiz)이 필요해
  // useQuestionActions의 함수를 통해 처리 — 일반 정답형/MH는 단순 revealedAt만 찍음(revealAnswer).
  const isQuiz = isQuizQuestion(question);
  const hasAnswer = isQuiz || question.correctAnswer;
  const isMH = ['mysteryBox', 'hintQuiz'].includes(question.type);
  if (!hasAnswer && !isMH) return null;

  // 정답 공개 후: 당첨자 공개 버튼 (mysteryBox/hintQuiz만)
  const presetWinners = question.winners || [];
  const revealedWinners = question.revealedWinners || 0;
  const canRevealWinner = question.revealedAt && isMH && presetWinners.length > 0 && revealedWinners < presetWinners.length;

  if (question.revealedAt && !canRevealWinner) return null;
  if (question.revealedAt && canRevealWinner) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Button onClick={async () => {
          await update(ref(db, `sessions/${sessionId}`), {
            [`questions/${currentQId}/revealedWinners`]: revealedWinners + 1,
          });
        }} variant="primary" size="lg">
          <Trophy size={20} />
          {revealedWinners + 1}등 당첨자 공개 ({revealedWinners}/{presetWinners.length})
        </Button>
      </div>
    );
  }

  const isHint = question.type === 'hintQuiz';
  const hints = question.hints || [];
  const revealedHints = question.revealedHints || 0;
  const canRevealHint = isHint && revealedHints < hints.length;

  async function handleRevealHint() {
    if (!canRevealHint) return;
    await update(ref(db, `sessions/${sessionId}`), {
      [`questions/${currentQId}/revealedHints`]: revealedHints + 1,
    });
  }

  async function handleRevealAnswer() {
    // 퀴즈는 useQuestionActions.revealQuiz가 점수 반영 + revealedAt까지 일괄 처리.
    // 그 외(choice/ox/fillinblank/ranking/mysteryBox/hintQuiz)는 revealAnswer가 revealedAt만 찍음.
    if (isQuiz) {
      await onRevealQuiz?.(currentQId);
    } else {
      await onRevealAnswer?.(currentQId);
    }
    // drumroll 잔여 상태 정리 (두구두구 경유든 직접 클릭이든 항상 false로)
    await update(ref(db, `sessions/${sessionId}`), { drumroll: null });
  }

  return (
    <>
      <DrumrollOverlay active={drumroll} onComplete={() => { setDrumroll(false); handleRevealAnswer(); }} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {canRevealHint && (
          <Button onClick={handleRevealHint} variant="secondary" size="lg">
            <ChevronRight size={20} />
            힌트 공개 ({revealedHints}/{hints.length})
          </Button>
        )}
        <Button onClick={async () => {
          await update(ref(db, `sessions/${sessionId}`), { drumroll: true });
          setDrumroll(true);
        }} variant="ghost" size="lg">
          두구두구
        </Button>
        <Button onClick={handleRevealAnswer} variant="primary" size="lg">
          <Eye size={20} />
          정답 공개
        </Button>
      </div>
    </>
  );
}


import { Medal, Ticket, Gift, Coffee, Award, HelpCircle, UserPlus } from 'lucide-react';

const PRESENT_MODES = [
  { mode: 'joinShow', label: '접속 현황', icon: UserPlus },
  { mode: 'combinedRanking', label: '합산 랭킹', icon: Medal },
  { mode: 'leaderboard', label: '리더보드', icon: Trophy },
  { mode: 'qaBoard', label: 'Q&A 보드', icon: MessageSquare },
  { mode: 'qaRanking', label: 'Q&A 랭킹', icon: HelpCircle },
  { mode: 'lottery', label: '추첨', icon: Ticket },
  { mode: 'breakTime', label: '쉬는 시간', icon: Coffee },
  { mode: 'awards', label: '시상식', icon: Award },
];

function PresentModeMenu({ sessionId, currentMode }) {
  const [open, setOpen] = useState(false);

  async function switchMode(mode) {
    await update(ref(db, `sessions/${sessionId}`), { currentMode: mode, currentQuestion: null });
    setOpen(false);
  }

  async function backToQuestion() {
    await update(ref(db, `sessions/${sessionId}`), { currentMode: 'waiting' });
    setOpen(false);
  }

  return (
    <div className="fixed bottom-24 right-3 md:bottom-28 md:right-5 z-20">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm shadow-lg active:scale-95 ${
            open ? 'bg-white text-slate-900 shadow-xl' : 'bg-slate-900/70 hover:bg-slate-900/95 hover:shadow-xl text-white ring-1 ring-white/20 hover:ring-white/40'
          }`}
        >
          ⚡ 모드
        </button>

        {open && (
          <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 overflow-hidden">
            {PRESENT_MODES.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  currentMode === mode
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
            <button
              onClick={backToQuestion}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <X size={14} />
              질문으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PresentationView({ sessionId, session, currentMode, onlineList, leaderboard, drawParticipants, studentUrl, count, onExit, scores, participants }) {
  const exitPresent = useCallback(() => onExit(), [onExit]);
  const { publishResult } = usePublishGameResult(sessionId);

  // 발표 모드에서도 퀴즈/정답형 정답 공개를 트리거할 수 있도록 reveal 함수를 가져옴.
  // QuestionManager는 이 모드에서 마운트되지 않으므로 PresentationView가 직접 hook 호출.
  const { revealQuiz, revealAnswer } = useQuestionActions(sessionId, session?.questions || {}, session?.currentQuestion, scores, participants);

  const handleGameResult = useCallback((resultNames, mode) => {
    const nameArr = Array.isArray(resultNames) ? resultNames : [resultNames];
    const allList = mode === 'lottery' ? drawParticipants : onlineList;
    const winners = nameArr.map((name) => {
      const p = allList.find((x) => x.nickname === name);
      return { id: p?.id || name, nickname: name };
    });
    const allIds = allList.map((p) => p.id);
    publishResult(mode, winners, allIds);
  }, [onlineList, drawParticipants, publishResult]);

  // 질문 네비게이션
  const questionList = useMemo(() => {
    return Object.entries(session?.questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  }, [session?.questions]);
  const currentQIdx = questionList.findIndex(([id]) => id === session?.currentQuestion);

  const goToQuestion = useCallback(async (qId) => {
    const q = session?.questions?.[qId];
    if (!q) return;
    const mode = isQuizQuestion(q) ? 'quiz' : 'poll';
    const updates = {
      currentQuestion: qId, currentMode: mode,
      [`questions/${qId}/activatedAt`]: Date.now(),
      [`questions/${qId}/revealedAt`]: null,
    };
    if (q.type === 'imageSlide') updates[`questions/${qId}/currentSlide`] = 0;
    if (q.type === 'hintQuiz') updates[`questions/${qId}/revealedHints`] = 0;
    if (['mysteryBox', 'hintQuiz'].includes(q.type)) updates[`questions/${qId}/revealedWinners`] = 0;
    await update(ref(db, `sessions/${sessionId}`), updates);
  }, [sessionId, session?.questions]);

  const goPrev = useCallback(() => {
    if (currentQIdx > 0) goToQuestion(questionList[currentQIdx - 1][0]);
  }, [currentQIdx, questionList, goToQuestion]);

  const goNext = useCallback(() => {
    if (currentQIdx < questionList.length - 1) goToQuestion(questionList[currentQIdx + 1][0]);
  }, [currentQIdx, questionList, goToQuestion]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') exitPresent();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      // 스페이스바: 이미지 슬라이드 다음 장
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const q = session?.questions?.[session?.currentQuestion];
        if (q?.type === 'imageSlide' && q.slideImages?.length > 1) {
          const cur = q.currentSlide || 0;
          if (cur < q.slideImages.length - 1) {
            update(ref(db, `sessions/${sessionId}/questions/${session.currentQuestion}`), { currentSlide: cur + 1 });
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exitPresent, goPrev, goNext]);

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-900 relative">
      <JoinToast sessionId={sessionId} />
      <ReactionOverlay sessionId={sessionId} />
      <ChatBubbleOverlay sessionId={sessionId} />
      <AnswerBubbleOverlay
        sessionId={sessionId}
        questionId={session?.currentQuestion}
      />

      <SideNoticesPanel sessionId={sessionId} />

      {/* 상시 과제 바 — 발표 모드에서도 강사가 제출 상태/심사 상태 확인 가능.
          단, 상시 과제 자체가 현재 활성 질문일 때는 메인 뷰에 이미 노출되므로 중복 방지 (학생 VoteModeContent와 동일 규칙). */}
      {session?.persistentAssignmentId && session?.currentQuestion !== session?.persistentAssignmentId && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20 w-[min(42rem,calc(100vw-6rem))] pointer-events-auto">
          <PersistentAssignmentBar
            sessionId={sessionId}
            session={session}
            onActivateQuestion={(qId) => {
              const q = session?.questions?.[qId];
              if (!q) return;
              const mode = isQuizQuestion(q) ? 'quiz' : 'poll';
              update(ref(db, `sessions/${sessionId}`), {
                currentQuestion: qId, currentMode: mode,
                [`questions/${qId}/activatedAt`]: Date.now(),
              });
            }}
          />
        </div>
      )}

      {/* Main content — responsive padding */}
      <div className="flex items-center justify-center min-h-dvh p-4 sm:p-8 lg:p-12 text-lg">
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
          scores={scores}
          onGameResult={handleGameResult}
        />
      </div>

      <PresentQROverlay sessionId={sessionId} studentUrl={studentUrl} count={count} />

      {/* 정답형/퀴즈/MH 두구두구 + 정답 공개 — 하단 중앙 */}
      <PresentRevealControls sessionId={sessionId} session={session} onRevealQuiz={revealQuiz} onRevealAnswer={revealAnswer} />

      {/* 이미지 슬라이드 컨트롤 */}
      {(() => {
        const q = session?.questions?.[session?.currentQuestion];
        if (q?.type !== 'imageSlide' || !q.slideImages?.length) return null;
        const cur = q.currentSlide || 0;
        const total = q.slideImages.length;
        return (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <Button onClick={() => update(ref(db, `sessions/${sessionId}/questions/${session.currentQuestion}`), { currentSlide: Math.max(0, cur - 1) })}
              variant="secondary" size="lg" disabled={cur <= 0}>
              <ChevronLeft size={20} /> 이전
            </Button>
            <div className="text-center">
              <span className="text-white/60 text-sm font-medium tabular-nums">{cur + 1} / {total}</span>
              <p className="text-white/30 text-[10px] mt-0.5">Space로 이동</p>
            </div>
            <Button onClick={() => update(ref(db, `sessions/${sessionId}/questions/${session.currentQuestion}`), { currentSlide: Math.min(total - 1, cur + 1) })}
              variant="primary" size="lg" disabled={cur >= total - 1}>
              다음 <ChevronRight size={20} />
            </Button>
          </div>
        );
      })()}

      {/* Bottom bar — participant count + navigation */}
      <div className="fixed bottom-3 left-3 md:bottom-5 md:left-5 flex items-center gap-2.5">
        <Badge variant="neutral" className="text-sm py-2 px-3.5"><Users size={16} className="mr-1.5" />{count}명</Badge>
        {questionList.length > 1 && (
          <>
            <button onClick={goPrev} disabled={currentQIdx <= 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 disabled:opacity-30 text-white text-sm font-semibold transition-all backdrop-blur-sm shadow-lg hover:shadow-xl active:scale-95">
              ← 이전
            </button>
            <span className="text-sm text-white/60 tabular-nums font-medium">{currentQIdx + 1}/{questionList.length}</span>
            <button onClick={goNext} disabled={currentQIdx >= questionList.length - 1}
              className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 disabled:opacity-30 text-white text-sm font-semibold transition-all backdrop-blur-sm shadow-lg hover:shadow-xl active:scale-95">
              다음 →
            </button>
          </>
        )}
      </div>

      {/* 우측 하단 — 모드 전환 */}
      <PresentModeMenu sessionId={sessionId} currentMode={currentMode} />

      <ExitHint onExit={exitPresent} />
    </div>
  );
}
