import { motion } from 'framer-motion';
import { Check, Ticket, X } from 'lucide-react';
import QuizEventBanner from './QuizEventBanner';

export default function QuizResult({ isCorrect, points, tickets = 0, correctAnswer, event = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-full rounded-[28px] border border-[#d8d0c2] bg-[linear-gradient(180deg,#fffdfa_0%,#f4efe7_100%)] px-5 py-6 shadow-[0_22px_40px_rgba(41,37,36,0.08)]"
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
          className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[22px] border ${
            isCorrect
              ? 'border-[#c9d4c9] bg-[#eef2ec] text-[#445646]'
              : 'border-[#ddd3ca] bg-[#f3eeea] text-[#6e5d52]'
          }`}
        >
          {isCorrect
            ? <Check size={34} />
            : <X size={34} />
          }
        </motion.div>

        <div className="space-y-2 text-center">
          <p className={`text-[28px] font-bold tracking-[-0.03em] ${isCorrect ? 'text-[#334a36]' : 'text-[#6e5d52]'}`}>
            {isCorrect ? '정답!' : '오답'}
          </p>
          <p className="text-sm leading-relaxed text-slate-500">
            {isCorrect
              ? '점수와 티켓이 반영되었습니다. 다음 라운드도 이어서 참여해보세요.'
              : '이번 라운드는 놓쳤지만 다음 문제에서 바로 만회할 수 있습니다.'}
          </p>
        </div>

        {!isCorrect && correctAnswer && (
          <div className="w-full rounded-[20px] border border-[#d9d2c6] bg-white/80 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">정답</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{correctAnswer}</p>
          </div>
        )}

        {(points > 0 || tickets > 0) && (
          <div className="grid w-full grid-cols-2 gap-2">
            {points > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-[20px] border border-[#dcd5cb] bg-white/80 px-4 py-3 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">점수</p>
                <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#37433a]">+{points}점</p>
              </motion.div>
            )}
            {tickets > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-[20px] border border-[#dcd5cb] bg-white/80 px-4 py-3 text-center"
              >
                <p className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Ticket size={14} />
                  티켓
                </p>
                <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#37433a]">{tickets}장</p>
              </motion.div>
            )}
          </div>
        )}

        {event && (
          <div className="w-full border-t border-[#ddd5c9] pt-4">
            <QuizEventBanner event={event} state="result" compact />
          </div>
        )}
      </div>
    </motion.div>
  );
}
