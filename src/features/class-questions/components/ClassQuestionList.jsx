import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, HelpCircle, Check, Trash2, ChevronUp } from 'lucide-react';
import { useClassQuestions } from '@/features/class-questions/api/useClassQuestions';

/**
 * Admin-side accordion list of class questions.
 * Shows student-posted questions sorted by upvotes. Instructor can mark answered or dismiss.
 */
function ClassQuestionList({ sessionId }) {
  const { questions, unansweredCount, markAnswered, dismissQuestion } =
    useClassQuestions(sessionId);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-400" />
          수업 질문
          {unansweredCount > 0 && (
            <motion.span
              key={unansweredCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold"
            >
              {unansweredCount}
            </motion.span>
          )}
        </span>
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 space-y-1.5">
              {questions.length === 0 && (
                <p className="text-slate-300 dark:text-slate-500 text-xs py-1">
                  학생 질문이 없습니다
                </p>
              )}
              <AnimatePresence>
                {questions.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-2.5 rounded-lg text-sm transition-colors ${
                      q.answered
                        ? 'bg-slate-50 dark:bg-slate-700/50 opacity-60'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      {q.text}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">{q.nickname}</span>
                        {q.upvoteCount > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400 text-xs">
                            <ChevronUp size={12} />
                            {q.upvoteCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!q.answered && (
                          <button
                            onClick={() => markAnswered(q.id)}
                            aria-label="답변 완료 표시"
                            className="text-slate-300 dark:text-slate-500 hover:text-emerald-500 transition-all active:scale-90 p-0.5"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {q.answered && (
                          <span className="text-emerald-500 text-[10px] font-medium">
                            답변 완료
                          </span>
                        )}
                        <button
                          onClick={() => dismissQuestion(q.id)}
                          aria-label="질문 삭제"
                          className="text-slate-300 dark:text-slate-500 hover:text-red-500 transition-all active:scale-90 p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(ClassQuestionList);
