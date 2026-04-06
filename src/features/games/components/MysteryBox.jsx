import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import { hapticSuccess } from '@/lib/haptics';

const ConfettiBurst = lazy(() => import('@/components/ui/ConfettiBurst'));

const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 22 };

/**
 * MysteryBox — 가운데 ? 박스에서 랜덤 텍스트가 빠르게 지나감.
 * "정답 보기" 클릭 시 멈추면서 정답 표시.
 *
 * Props:
 * - items: string[] — 박스에서 랜덤으로 돌아갈 후보 텍스트들
 * - answer: string — 최종 정답
 * - title: string? — 상단 타이틀 (optional)
 */
export default function MysteryBox({ items = [], answer = '', title = '' }) {
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const textRef = useRef(null);
  const intervalRef = useRef(null);
  const allItems = items.length > 0 ? items : ['?', '??', '???'];

  // Start spinning on mount
  useEffect(() => {
    setSpinning(true);
  }, []);

  // DOM-direct cycling for smooth animation (no React re-renders)
  useEffect(() => {
    if (spinning && !revealed && allItems.length > 0) {
      let idx = 0;
      intervalRef.current = setInterval(() => {
        if (textRef.current) {
          textRef.current.textContent = allItems[idx % allItems.length];
          idx++;
        }
      }, 90);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [spinning, revealed, allItems]);

  const handleReveal = useCallback(() => {
    // Slow down → stop → reveal
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Gradual slowdown effect
    let delay = 90;
    let idx = 0;
    function slowCycle() {
      if (delay > 400) {
        // Final reveal
        setSpinning(false);
        setRevealed(true);
        hapticSuccess();
        return;
      }
      if (textRef.current) {
        textRef.current.textContent = allItems[idx % allItems.length];
        idx++;
      }
      delay += 40;
      setTimeout(slowCycle, delay);
    }
    slowCycle();
  }, [allItems]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Title */}
      {title && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-center"
        >
          {title}
        </motion.p>
      )}

      {/* Mystery Box */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING_BOUNCY}
        className="relative"
      >
        <motion.div
          animate={spinning && !revealed
            ? { rotate: [0, -1, 1, -1, 0], scale: [1, 1.02, 0.98, 1.02, 1] }
            : {}}
          transition={spinning && !revealed
            ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
            : {}}
          className={`w-56 h-56 md:w-72 md:h-72 rounded-3xl flex items-center justify-center overflow-hidden transition-colors duration-500 ${
            revealed
              ? 'bg-slate-900 dark:bg-slate-100 shadow-2xl shadow-slate-900/30'
              : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg'
          }`}
        >
          {revealed ? (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ ...SPRING_BOUNCY, delay: 0.1 }}
              className="flex flex-col items-center gap-3 px-6"
            >
              <Suspense fallback={null}><ConfettiBurst /></Suspense>
              <p className="text-3xl md:text-4xl font-bold text-white dark:text-slate-900 text-center leading-tight">
                {answer}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* Cycling text */}
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <HelpCircle size={48} className="text-slate-300 dark:text-slate-600" />
              </motion.div>
              <span
                ref={textRef}
                className="text-2xl md:text-3xl font-bold text-slate-400 dark:text-slate-500 tabular-nums min-h-[2.5rem] text-center px-4"
              >
                ?
              </span>
            </div>
          )}
        </motion.div>

        {/* Decorative pulse rings while spinning */}
        {spinning && !revealed && (
          <>
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-slate-200 dark:border-slate-600"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}
      </motion.div>

      {/* Reveal button */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ delay: 0.5 }}
          >
            <Button onClick={handleReveal} variant="primary" size="lg">
              <Eye size={20} />
              정답 보기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
