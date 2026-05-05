import { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, Hand, MessageSquare, Trophy, Heart, Copy, Check, Ticket, Coffee, UserCircle, Award } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useParticipants } from '@/features/participants/api/useParticipants';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import StudentHeader from './StudentHeader';
import StudentBottomBar from './StudentBottomBar';
import IdleMascot from './IdleMascot';
import { getNickname } from '@/lib/participant';
import ReviewingBanner from '@/components/ui/ReviewingBanner';
import { useGameResult } from '@/features/games/api/useGameResult';
import PersistentAssignmentCard from '@/features/ai-judge/components/PersistentAssignmentCard';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

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
      setIndex((prev) => {
        const next = prev + 1;
        // Stop after one full cycle — all tips shown once
        if (next >= TIPS.length) {
          clearInterval(interval);
          return prev;
        }
        return next;
      });
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
  lottery: { label: '추첨 진행 중', icon: Ticket },
  breakTime: { label: '쉬는 시간', icon: Coffee },
  qaBoard: { label: 'Q&A 보드 진행 중', icon: Users },
  randomPicker: { label: '발표자 뽑기 진행 중', icon: UserCircle },
  awards: { label: '시상식 진행 중', icon: Award },
};

export default memo(function WaitingPage({ sessionId, pendingEvent = null, courseName = null, currentMode = null, persistentAssignmentId = null, persistentAssignmentTitle = null }) {
  const { count } = useParticipants(sessionId);
  const nickname = getNickname();
  const { isWinner, winnerNames, gameResult } = useGameResult(sessionId);

  // 당첨 결과가 있고, 현재 추첨 모드일 때 인라인으로 표시
  const showGameResult = gameResult && currentMode === 'lottery';

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-20">
      <StudentHeader sessionId={sessionId} />

      {/* 상시 과제 — 대기 화면에도 노출되어 학생이 언제든 제출 가능 */}
      {persistentAssignmentId && (
        <div className="w-full max-w-xl mb-6">
          <PersistentAssignmentCard
            sessionId={sessionId}
            questionId={persistentAssignmentId}
            questionTitle={persistentAssignmentTitle}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {showGameResult ? (
          <motion.div
            key="game-result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-center w-full max-w-sm space-y-6"
          >
            <Suspense fallback={null}><ConfettiBurst /></Suspense>

            {/* Winner trophy */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
                  transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
                >
                  <Trophy size={36} className="text-white dark:text-slate-900" />
                </motion.div>
              </div>
            </motion.div>

            {/* Result heading */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {isWinner ? '축하합니다!' : '당첨자 발표'}
              </h2>
              {isWinner && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-500 dark:text-slate-400 text-sm"
                >
                  추첨에서 당첨되었어요!
                </motion.p>
              )}
            </div>

            {/* Winner names */}
            <div className="flex flex-col items-center gap-3">
              {winnerNames.map((name, i) => {
                const isMeWinner = name === nickname;
                return (
                  <motion.div
                    key={name + i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 400, damping: 22 }}
                    className={`flex items-center gap-3 rounded-2xl py-3 px-5 ${
                      isMeWinner
                        ? 'bg-slate-900 dark:bg-slate-100'
                        : 'bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Avatar name={name} size="md" />
                    <span className={`text-lg font-bold tracking-tight ${
                      isMeWinner
                        ? 'text-white dark:text-slate-900'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {name}
                    </span>
                    {isMeWinner && (
                      <span className="text-xs font-bold bg-white/20 dark:bg-slate-900/20 px-2 py-0.5 rounded-full text-white/90 dark:text-slate-900/80">
                        나!
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {!isWinner && winnerNames.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-400 dark:text-slate-500 text-sm"
              >
                다음 기회에 도전해보세요
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center w-full max-w-xs sm:max-w-sm space-y-6"
          >
            {/* Mascot with idle animations — smaller on compact screens */}
            <div className="flex justify-center scale-[0.85] sm:scale-100 origin-center">
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
        )}
      </AnimatePresence>

      <ReviewingBanner sessionId={sessionId} />
      <StudentBottomBar sessionId={sessionId} />
    </div>
  );
});
