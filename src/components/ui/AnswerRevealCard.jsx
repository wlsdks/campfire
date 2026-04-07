import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

/**
 * AnswerRevealCard — 학생 화면에서 정답 공개 시 표시.
 * 정답 + 내가 맞았는지 여부.
 */
export default memo(function AnswerRevealCard({ correctAnswer, myAnswer }) {
  if (!correctAnswer) return null;

  const isCorrect = myAnswer && correctAnswer.trim().toLowerCase() === (myAnswer || '').trim().toLowerCase();
  const hasAnswered = !!myAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl overflow-hidden"
    >
      <div className={`p-5 text-center ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
        {hasAnswered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
            className="mx-auto mb-3"
          >
            {isCorrect ? (
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-slate-300 dark:bg-slate-500 rounded-full flex items-center justify-center mx-auto">
                <X size={24} className="text-white" />
              </div>
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-lg font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
        >
          {hasAnswered ? (isCorrect ? '정답입니다!' : '아쉽지만 오답입니다') : '미응답'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg"
        >
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">정답</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{correctAnswer}</p>
        </motion.div>

        {hasAnswered && !isCorrect && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-slate-400 dark:text-slate-500"
          >
            내 답변: {myAnswer}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
});
