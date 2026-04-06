import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import QuizResult from '@/features/quiz/components/QuizResult';
import { getQuizReward } from '@/lib/quiz';

// --- Lazy-loaded mode pages ---
const LazyLeaderboardPage = lazy(() => import('./LeaderboardPage'));
const LazySessionEndedPage = lazy(() => import('./SessionEndedPage'));
const LazyClassQABoard = lazy(() => import('@/features/class-questions/components/ClassQABoard'));
const LazyFocusOverlay = lazy(() => import('@/features/session/components/FocusOverlay'));
const LazyComprehensionCheck = lazy(() => import('@/features/session/components/ComprehensionCheck'));
const LazyQuickSurvey = lazy(() => import('@/features/session/components/QuickSurvey'));
const LazyGroupDiscussion = lazy(() => import('@/features/session/components/GroupDiscussion'));

// --- Mode transition variants ---
// poll/quiz: slide up   leaderboard: curtain from top
// special modes: scale-in   waiting: fade   ended/reviewing: slide from below
export function getModeVariants(modeKey) {
  if (modeKey === 'leaderboard') {
    return { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 24 } };
  }
  if (modeKey === 'ended' || modeKey === 'reviewing') {
    return { initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -12, scale: 0.98 } };
  }
  if (['focus', 'comprehension', 'quickSurvey', 'discussion', 'qaBoard'].includes(modeKey)) {
    return { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } };
  }
  if (modeKey === 'waiting') {
    return { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
  }
  return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };
}

// Spring transition for mode changes (~0.3s enter)
export const ENTER_TRANSITION = { type: 'spring', stiffness: 280, damping: 26 };

/** Renders QuizResult from vote data passed by QuizVoter. */
export function QuizResultFromVote({ question, currentVote, streak = 0 }) {
  if (!currentVote) return null;
  const reward = getQuizReward(question, currentVote);
  return (
    <QuizResult
      isCorrect={reward.isCorrect}
      points={reward.points}
      tickets={reward.tickets}
      correctAnswer={question.correctAnswer}
      event={question.event || null}
      bet={reward.bet || 1}
      streak={reward.isCorrect ? streak : 0}
    />
  );
}

/** Timer expired overlay shown when countdown reaches zero. */
export function TimerExpiredOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-2"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center"
      >
        <Clock size={22} className="text-white dark:text-slate-900" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
      >
        시간이 종료되었습니다
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-400 dark:text-slate-500"
      >
        응답하지 못했습니다 · 결과를 기다려주세요
      </motion.p>
    </motion.div>
  );
}

/**
 * VoteModeContent — dispatch component that renders the correct view per session mode.
 * Extracted from VotePage.jsx (448→133 lines). Imports are direct (no circular deps).
 */
export { VoteModeContent } from './VoteModeContent';
