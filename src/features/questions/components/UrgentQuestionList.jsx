import { useState } from 'react';
import { ref, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, ChevronDown } from 'lucide-react';

export default function UrgentQuestionList({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-slate-400" />
          긴급 질문
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-900 text-white text-[10px] font-bold"
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
                <p className="text-slate-300 text-xs py-1">수신된 질문이 없습니다</p>
              )}
              <AnimatePresence>
                {questionList.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="button"
                    aria-label={q.read ? '읽은 질문' : '읽지 않은 질문 -- 클릭하여 읽음 처리'}
                    className={`p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      q.read ? 'bg-slate-50' : 'bg-slate-100 hover:bg-slate-50'
                    }`}
                    onClick={() => !q.read && markRead(q.id)}
                  >
                    <div className="flex items-start gap-2">
                      {!q.read && <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 leading-relaxed">{q.text}</p>
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
    </div>
  );
}
