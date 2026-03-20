import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import QuizResult from '@/features/quiz/components/QuizResult';
import { getQuizReward } from '@/lib/quiz';

export const TYPE_LABELS = {
  choice: '객관식',
  ox: 'O/X',
  quiz: '퀴즈',
  wordcloud: '워드클라우드',
  qna: 'Q&A',
  scale: '감정 온도계',
  debate: '찬반 토론',
  ranking: '순위 맞추기',
  fillinblank: '빈칸 채우기',
};

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
      className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-2"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center"
      >
        <Clock size={22} className="text-white" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold text-slate-900"
      >
        시간이 종료되었습니다
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-400"
      >
        결과를 기다려주세요
      </motion.p>
    </motion.div>
  );
}
