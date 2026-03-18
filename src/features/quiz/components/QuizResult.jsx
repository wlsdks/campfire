import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function QuizResult({ isCorrect, points, correctAnswer }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-4 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          isCorrect ? 'bg-emerald-100' : 'bg-red-100'
        }`}
      >
        {isCorrect
          ? <Check size={32} className="text-emerald-600" />
          : <X size={32} className="text-red-500" />
        }
      </motion.div>

      <div className="text-center space-y-1">
        <p className={`text-xl font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
          {isCorrect ? '정답!' : '오답'}
        </p>
        {!isCorrect && correctAnswer && (
          <p className="text-slate-400 text-sm">정답: {correctAnswer}</p>
        )}
      </div>

      {points > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-lg"
        >
          +{points}점
        </motion.div>
      )}
    </motion.div>
  );
}
