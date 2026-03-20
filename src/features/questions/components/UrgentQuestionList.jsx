import { useState } from 'react';
import { ref, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function UrgentQuestionList({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  async function markRead(questionId) {
    try {
      await update(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`), { read: true });
    } catch (err) {
      console.error('질문 읽음 처리 실패:', err);
    }
  }

  async function dismissOne(questionId) {
    try {
      await remove(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`));
    } catch (err) {
      console.error('질문 삭제 실패:', err);
    }
  }

  function handleQuestionClick(q) {
    setSelectedQuestion(q);
  }

  function handleConfirm() {
    if (selectedQuestion) {
      dismissOne(selectedQuestion.id);
      setSelectedQuestion(null);
    }
  }

  function handleClose() {
    if (selectedQuestion && !selectedQuestion.read) {
      markRead(selectedQuestion.id);
    }
    setSelectedQuestion(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-slate-400" />
          긴급 질문
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse"
            >
              {unreadCount}
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
              {questionList.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-xs py-1">수신된 질문이 없습니다</p>
              )}
              <AnimatePresence>
                {questionList.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="button"
                    aria-label={q.read ? '읽은 질문' : '읽지 않은 질문 -- 클릭하여 확인'}
                    className={`p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      q.read
                        ? 'bg-slate-50 dark:bg-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md'
                    }`}
                    onClick={() => handleQuestionClick(q)}
                  >
                    <div className="flex items-start gap-2">
                      {!q.read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-slate-400 text-xs">익명</span>
                          <button
                            aria-label="질문 삭제"
                            onClick={(e) => { e.stopPropagation(); dismissOne(q.id); }}
                            className="text-slate-300 hover:text-red-500 transition-all active:scale-90"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={!!selectedQuestion}
        onClose={handleClose}
        ariaLabel="긴급 질문 확인"
      >
        {selectedQuestion && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">긴급 질문</h3>
            <p className="text-xs text-slate-400 mb-4">익명</p>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
              {selectedQuestion.text}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                닫기
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirm}>
                확인
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
