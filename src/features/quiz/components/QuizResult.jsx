import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Check, Ticket, X } from 'lucide-react';
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

export default function QuizResult({ isCorrect, points, tickets = 0, correctAnswer, event = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-8 shadow-sm overflow-hidden relative"
    >
      {isCorrect && <ConfettiBurst />}
      <div className="flex flex-col items-center gap-4 relative z-[1]">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 340, damping: 22 }}
          >
            {isCorrect
              ? <Check size={36} className="text-slate-800" strokeWidth={2.5} />
              : <X size={36} className="text-slate-400" strokeWidth={2.5} />
            }
          </motion.div>
        </div>

        <div className="space-y-1 text-center">
          <p className={`text-2xl font-bold ${isCorrect ? 'text-slate-900' : 'text-slate-500'}`}>
            {isCorrect ? '정답!' : '오답'}
          </p>
          <p className="text-sm text-slate-400">
            {isCorrect
              ? '다음 라운드도 이어서 참여해보세요'
              : '다음 문제에서 만회할 수 있습니다'}
          </p>
        </div>

        {!isCorrect && correctAnswer && (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-slate-400">정답</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{correctAnswer}</p>
          </div>
        )}

        {(points > 0 || tickets > 0) && (
          <div className="flex items-center justify-center gap-6 pt-2">
            {points > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 26 }}
                className="text-center"
              >
                <p className="text-xs font-medium text-slate-400">점수</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                  <CountUp value={points} />
                </p>
              </motion.div>
            )}
            {points > 0 && tickets > 0 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.35, duration: 0.25, ease: 'easeOut' }}
                className="w-px h-8 bg-slate-200"
              />
            )}
            {tickets > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, type: 'spring', stiffness: 300, damping: 26 }}
                className="text-center"
              >
                <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1">
                  <Ticket size={12} />
                  티켓
                </p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">{tickets}장</p>
              </motion.div>
            )}
          </div>
        )}

        {event && (
          <div className="w-full border-t border-slate-100 pt-4">
            <QuizEventBanner event={event} state="result" compact />
          </div>
        )}
      </div>
    </motion.div>
  );
}
