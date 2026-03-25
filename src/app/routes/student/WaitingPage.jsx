import { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, Hand, MessageSquare, Trophy, Heart, Copy, Check, Target, Ticket, Gift, Dices, CircleDot, Coffee, UserCircle, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import IdleMascot from './IdleMascot';
import { getNickname } from '@/lib/participant';
import ReviewingBanner from '@/components/ui/ReviewingBanner';
import { useGameResult } from '@/features/games/api/useGameResult';

const GameResultOverlay = lazy(() => import('@/features/games/components/GameResultOverlay'));

const TIPS = [
  { text: '강사가 질문을 활성화하면 자동으로 전환됩니다', icon: Zap },
  { text: '하단 바에서 손들기, 긴급 질문을 보낼 수 있어요', icon: Hand },
  { text: '채팅으로 다른 학생들과 소통해보세요', icon: MessageSquare },
  { text: '퀴즈에서 빠르게 답하면 보너스 점수를 받을 수 있어요', icon: Trophy },
  { text: '리액션으로 수업에 참여해보세요', icon: Heart },
];

/** Rotating tips with icon and crossfade animation. */
function RotatingTip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tip = TIPS[index];
  const Icon = tip.icon;

  return (
    <div className="relative h-10 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[14px] text-center absolute px-4"
        >
          <Icon size={16} className="text-slate-400 shrink-0" />
          <span>{tip.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Session code badge with copy-to-clipboard. */
function CopyableCode({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors duration-150 active:scale-[0.96]"
      aria-label="세션 코드 복사"
    >
      {code}
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Check size={12} className="text-emerald-500" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Copy size={12} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

const GAME_MODES = {
  roulette: { label: '돌림판 진행 중', icon: Target },
  lottery: { label: '추첨 진행 중', icon: Ticket },
  prizeDraw: { label: '경품 추첨 진행 중', icon: Gift },
  slotMachine: { label: '777 슬롯 진행 중', icon: Dices },
  plinko: { label: '핀볼 진행 중', icon: CircleDot },
  breakTime: { label: '쉬는 시간', icon: Coffee },
  teamBattle: { label: '팀 대항전 진행 중', icon: Trophy },
  qaBoard: { label: 'Q&A 보드 진행 중', icon: Users },
  randomPicker: { label: '발표자 뽑기 진행 중', icon: UserCircle },
  awards: { label: '시상식 진행 중', icon: Award },
};

export default memo(function WaitingPage({ sessionId, pendingEvent = null, courseName = null, currentMode = null }) {
  const { count } = useParticipants(sessionId);
  const nickname = getNickname();
  const { isWinner, winnerNames, gameResult, showOverlay, dismiss } = useGameResult(sessionId);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 pb-32 pt-16">
      <StudentHeader sessionId={sessionId} />
      <Suspense fallback={null}>
        <GameResultOverlay
          isWinner={isWinner}
          winnerNames={winnerNames}
          gameResult={gameResult}
          showOverlay={showOverlay}
          dismiss={dismiss}
        />
      </Suspense>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center w-full max-w-xs space-y-6"
      >
        {/* Mascot with idle animations */}
        <div className="flex justify-center">
          <IdleMascot />
        </div>

        {/* Greeting + Status */}
        <div className="space-y-2">
          {nickname && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
              className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight leading-tight"
            >
              {nickname}님, 준비 완료!
            </motion.p>
          )}
          {courseName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-slate-500 dark:text-slate-400 text-base font-medium"
            >
              {courseName}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          >
            {GAME_MODES[currentMode] ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium">
                {(() => { const MIcon = GAME_MODES[currentMode].icon; return <MIcon size={16} className="text-slate-400" />; })()}
                <span>{GAME_MODES[currentMode].label}</span>
                {currentMode !== 'breakTime' && (
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                다음 질문을 기다리는 중...
              </p>
            )}
          </motion.div>
        </div>

        {/* Participant count */}
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              key={count}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5"
            >
              <motion.div
                key={`icon-${count}`}
                initial={{ rotate: -12, scale: 1.3 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                <Users size={16} className="text-slate-400" />
              </motion.div>
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                <motion.span
                  key={count}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight tabular-nums inline-block"
                >{count}</motion.span>
                <span className="ml-0.5 text-xs text-slate-400">명 참여 중</span>
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Session code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-center justify-center"
        >
          <CopyableCode code={sessionId} />
        </motion.div>

        {/* Rotating tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <RotatingTip />
        </motion.div>

        {/* Quiz event banner */}
        {pendingEvent && (
          <div className="pt-1 max-w-xl mx-auto">
            <QuizEventBanner event={pendingEvent} state="pending" />
          </div>
        )}
      </motion.div>

      <ReviewingBanner sessionId={sessionId} />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
});
