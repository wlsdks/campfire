import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { TYPE_LABELS } from '@/lib/question-types';

/**
 * 질문 카드 헤더 — 진행도 바 + 질문 제목 + 타입 뱃지
 * Props:
 *   question       – 질문 객체 { title, type, betting }
 *   questionId     – string (animation key)
 *   questionProgress – { current, total } | null
 */
export default function QuestionCard({ question, questionId, questionProgress }) {
  return (
    <motion.div
      key={`header-${questionId}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
    >
      {questionProgress && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
            질문{' '}
            <motion.span
              key={questionProgress.current}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block"
            >
              {questionProgress.current}
            </motion.span>
            /{questionProgress.total}
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
            />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight flex-1">
          {question.title}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {question.type === 'quiz' && question.betting && (
            <Badge variant="neutral">베팅</Badge>
          )}
          <Badge variant="primary">{TYPE_LABELS[question.type] || question.type}</Badge>
        </div>
      </div>
      {question.imageUrl && (
        <motion.img
          src={question.imageUrl}
          alt="질문 이미지"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 w-full max-h-52 object-cover rounded-lg"
        />
      )}
    </motion.div>
  );
}
