import { lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, PartyPopper, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { getNickname } from '@/lib/participant';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const MODE_LABELS = {
  roulette: '돌림판',
  lottery: '추첨',
  prizeDraw: '추첨',
  slotMachine: '777 슬롯',
  plinko: '핀볼',
};

/**
 * GameResultOverlay — shows game result to students in real-time.
 *
 * Winner: celebration overlay with confetti + "당첨!" message.
 * Non-winner: subtle encouraging banner at top.
 *
 * @param {{ isWinner, winnerNames, gameResult, showOverlay, dismiss }} props
 */
export default function GameResultOverlay({ isWinner, winnerNames, gameResult, showOverlay, dismiss }) {
  const nickname = getNickname() || '참여자';
  const modeName = MODE_LABELS[gameResult?.mode] || '게임';

  // Auto-dismiss non-winner banner after 5 seconds
  useEffect(() => {
    if (showOverlay && !isWinner) {
      const timer = setTimeout(dismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay, isWinner, dismiss]);

  return (
    <AnimatePresence>
      {showOverlay && isWinner && (
        <motion.div
          key="winner-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={dismiss}
        >
          <Suspense fallback={null}>
            <ConfettiBurst />
          </Suspense>
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto">
                <Trophy size={32} className="text-slate-900 dark:text-slate-100" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                당첨!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {modeName}에서 선택되었어요
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700 rounded-full py-2 pl-2 pr-5">
                <Avatar name={nickname} size="md" />
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">{nickname}</span>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={dismiss}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150 pt-2"
            >
              닫기
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {showOverlay && !isWinner && (
        <motion.div
          key="non-winner-banner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-16 left-4 right-4 z-40 pointer-events-auto"
        >
          <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <PartyPopper size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {winnerNames.length === 0
                  ? '당첨자가 발표되었습니다'
                  : winnerNames.length === 1
                    ? `${winnerNames[0]}님 당첨!`
                    : `${winnerNames[0]}님 외 ${winnerNames.length - 1}명 당첨!`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                다음 기회에 도전해보세요
              </p>
            </div>
            <button onClick={dismiss} aria-label="결과 닫기" className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors duration-150 shrink-0">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
