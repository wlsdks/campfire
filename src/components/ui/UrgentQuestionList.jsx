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
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
      <span className="text-red-400 font-semibold text-sm">
        ❓ 긴급 질문 {unreadCount > 0 && `(${unreadCount} 새 질문)`}
      </span>
      <AnimatePresence>
        {questionList.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-2 rounded-lg text-sm ${q.read ? 'bg-gray-800/50' : 'bg-red-500/20'}`}
            onClick={() => !q.read && markRead(q.id)}
          >
            <p className="text-white">{q.text}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white/30 text-xs">익명</span>
              <button onClick={() => dismissOne(q.id)} className="text-white/30 hover:text-white text-xs">삭제</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
