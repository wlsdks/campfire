import { ref, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default function UrgentQuestionList({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);

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

  if (questionList.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
      <span className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
        <AlertCircle size={14} className="text-slate-400" />
        긴급 질문
        {unreadCount > 0 && <Badge variant="primary">{unreadCount} 새 질문</Badge>}
      </span>
      <AnimatePresence>
        {questionList.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="button"
            aria-label={q.read ? '읽은 질문' : '읽지 않은 질문 — 클릭하여 읽음 처리'}
            className={`p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
              q.read ? 'bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50'
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
                    className="text-slate-300 hover:text-red-500 transition-colors"
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
  );
}
