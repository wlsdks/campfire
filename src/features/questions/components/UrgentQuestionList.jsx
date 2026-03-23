import { useState, useRef } from 'react';
import { ref, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, ChevronDown, MessageCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { logger } from '@/lib/logger';

export default function UrgentQuestionList({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const reviewingIdRef = useRef(null);

  async function markRead(questionId) {
    try {
      await update(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`), { read: true });
    } catch (err) {
      logger.error('질문 읽음 처리 실패:', err);
    }
  }

  async function dismissOne(questionId) {
    try {
      await remove(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`));
    } catch (err) {
      logger.error('질문 삭제 실패:', err);
    }
  }

  async function setReviewing(questionId, value) {
    try {
      await update(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`), { reviewing: value });
    } catch (err) {
      logger.error('질문 reviewing 상태 변경 실패:', err);
    }
  }

  function handleQuestionClick(q) {
    setSelectedQuestion(q);
    reviewingIdRef.current = q.id;
    setReviewing(q.id, true);
  }

  function handleConfirm() {
    if (selectedQuestion) {
      // Question gets deleted entirely, no need to clear reviewing
      reviewingIdRef.current = null;
      dismissOne(selectedQuestion.id);
      setSelectedQuestion(null);
    }
  }

  function handleClose() {
    if (selectedQuestion && !selectedQuestion.read) {
      markRead(selectedQuestion.id);
    }
    if (reviewingIdRef.current) {
      setReviewing(reviewingIdRef.current, false);
      reviewingIdRef.current = null;
    }
    setSelectedQuestion(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors duration-150"
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
                    className={`p-2.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer ${
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
                            className="text-slate-300 hover:text-red-500 transition-colors duration-150 active:scale-90"
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
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <MessageCircle size={28} className="text-slate-400 mx-auto mb-3" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.04 }}
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              긴급 질문
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.08 }}
              className="text-xs text-slate-400 mt-1"
            >
              익명
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.12 }}
              className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed mt-6 mb-8"
            >
              {selectedQuestion.text}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.16 }}
              className="space-y-2"
            >
              <Button variant="primary" size="lg" onClick={handleConfirm} className="w-full">
                확인
              </Button>
              <button
                onClick={handleClose}
                className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </Modal>
    </div>
  );
}
