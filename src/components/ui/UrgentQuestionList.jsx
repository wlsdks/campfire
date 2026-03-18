import { ref, update, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useUrgentQuestions } from '../../hooks/useUrgentQuestions';
import { motion, AnimatePresence } from 'framer-motion';

export default function UrgentQuestionList({ sessionId }) {
  const { questionList, unreadCount } = useUrgentQuestions(sessionId);

  async function markRead(questionId) {
    await update(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`), { read: true });
  }

  async function dismissOne(questionId) {
    await remove(ref(db, `sessions/${sessionId}/urgentQuestions/${questionId}`));
  }

  if (questionList.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2.5">
      <span className="text-rose-600 font-semibold text-sm flex items-center gap-1.5">
        ❓ 긴급 질문
        {unreadCount > 0 && (
          <span className="bg-rose-100 text-rose-600 text-xs px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount} 새 질문</span>
        )}
      </span>
      <AnimatePresence>
        {questionList.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
              q.read ? 'bg-white' : 'bg-rose-100 hover:bg-rose-200'
            }`}
            onClick={() => !q.read && markRead(q.id)}
          >
            <p className="text-gray-700 leading-relaxed">{q.text}</p>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-gray-400 text-xs">익명</span>
              <button onClick={(e) => { e.stopPropagation(); dismissOne(q.id); }} className="text-gray-400 hover:text-rose-500 text-xs transition-colors">삭제</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
