import { motion } from 'framer-motion';
import { MessageSquare, Trash2 } from 'lucide-react';
import { QUESTION_TYPES } from '@/lib/question-types';

export default function LibraryQuestionCard({ question, onDelete, index }) {
  const qType = QUESTION_TYPES.find((t) => t.value === question.type);
  const Icon = qType?.icon || MessageSquare;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-150 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-400">{qType?.label}</span>
            {question.tag && (
              <span className="text-[11px] px-1.5 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-600">
                {question.tag}
              </span>
            )}
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{question.title}</p>
          {question.options && (
            <div className="flex flex-wrap gap-1 mt-2">
              {question.options.map((opt, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-md ${
                    question.correctAnswer === opt
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
          {question.type === 'ox' && question.correctAnswer && (
            <div className="flex gap-1.5 mt-2">
              {['O', 'X'].map((v) => (
                <span
                  key={v}
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                    question.correctAnswer === v
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(question.id)}
          className="p-1.5 rounded-lg text-slate-200 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          title="삭제"
          aria-label="질문 삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
