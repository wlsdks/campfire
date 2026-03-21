import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Check, Ticket, X, Flame } from 'lucide-react';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import ConfettiBurst from './ConfettiBurst';

function CountUp({ value, prefix = '+', suffix = '점' }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef(null);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v}${suffix}`;
    });
    const controls = animate(motionVal, value, { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] });
    return () => { controls.stop(); unsubscribe(); };
  }, [value, motionVal, rounded, prefix, suffix]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

export default function QuizResult({ isCorrect, points, tickets = 0, correctAnswer, event = null, bet = 1, streak = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-5 py-8 shadow-sm overflow-hidden relative"
    >
      {isCorrect && <ConfettiBurst />}
      <div className="flex flex-col items-center gap-4 relative z-[1]">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 400, damping: 22 }}
          >
            {isCorrect
              ? <Check size={36} className="text-slate-800" strokeWidth={2.5} />
              : <X size={36} className="text-slate-400" strokeWidth={2.5} />
            }
          </motion.div>
        </div>

        <div className="space-y-1 text-center">
          <p className={`text-2xl font-bold tracking-tight ${isCorrect ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
            {isCorrect ? '정답!' : '오답'}
          </p>
          <p className="text-sm text-slate-400">
            {isCorrect
              ? streak >= 3 ? '연승 행진 중! 계속 이어가세요' : '다음 라운드도 이어서 참여해보세요'
              : '다음 문제에서 만회할 수 있습니다'}
          </p>
        </div>

        {/* Streak fire badge — shown when 3+ consecutive correct */}
        {isCorrect && streak >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 22 }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-sm ${
              streak >= 5
                ? 'bg-slate-900 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-200'
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            <motion.div
              animate={{ rotate: [-4, 4, -4], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: streak >= 5 ? 0.5 : 0.8, ease: 'easeInOut' }}
            >
              <Flame size={15} className={streak >= 5 ? 'text-white' : 'text-slate-500'} />
            </motion.div>
            <span className="font-bold text-sm tabular-nums">{streak}연속 정답!</span>
          </motion.div>
        )}

        {!isCorrect && correctAnswer && (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 px-4 py-3 text-center">
            <p className="text-xs font-medium text-slate-400">정답</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{correctAnswer}</p>
          </div>
        )}

        {/* Bet multiplier badge */}
        {bet > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 300, damping: 25 }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold"
          >
            {bet}x 베팅
          </motion.div>
        )}

        {(points > 0 || points < 0 || tickets > 0) && (
          <div className="flex items-center justify-center gap-6 pt-2">
            {points !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
                className="text-center"
              >
                <p className="text-xs font-medium text-slate-400">점수</p>
                <p className={`mt-0.5 text-2xl font-bold tracking-tight ${points < 0 ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                  <CountUp value={Math.abs(points)} prefix={points < 0 ? '-' : '+'} />
                </p>
              </motion.div>
            )}
            {points !== 0 && tickets > 0 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.35, duration: 0.25, ease: 'easeOut' }}
                className="w-px h-8 bg-slate-200"
              />
            )}
            {tickets > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, type: 'spring', stiffness: 300, damping: 25 }}
                className="text-center"
              >
                <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1">
                  <Ticket size={12} />
                  티켓
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{tickets}장</p>
              </motion.div>
            )}
          </div>
        )}

        {event && (
          <div className="w-full border-t border-slate-100 dark:border-slate-700 pt-4">
            <QuizEventBanner event={event} state="result" compact />
          </div>
        )}
      </div>
    </motion.div>
  );
}
