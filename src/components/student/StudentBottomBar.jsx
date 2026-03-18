import { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getParticipantId, getNickname } from '../../lib/participant';
import { useHandRaises } from '../../hooks/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentBottomBar({ sessionId }) {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { handRaises } = useHandRaises(sessionId);

  const pid = getParticipantId();
  const isRaised = handRaises[pid]?.raised === true;

  async function toggleHand() {
    const handRef = ref(db, `sessions/${sessionId}/handRaises/${pid}`);
    if (isRaised) {
      await set(handRef, { nickname: getNickname(), raised: false, raisedAt: null });
    } else {
      await set(handRef, { nickname: getNickname(), raised: true, raisedAt: serverTimestamp() });
    }
  }

  async function submitUrgentQuestion(e) {
    e.preventDefault();
    if (!questionText.trim()) return;
    const urgentRef = ref(db, `sessions/${sessionId}/urgentQuestions`);
    await push(urgentRef, {
      text: questionText.trim(),
      timestamp: serverTimestamp(),
      read: false,
    });
    setQuestionText('');
    setShowQuestionInput(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <>
      <AnimatePresence>
        {showQuestionInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center p-4"
            onClick={() => setShowQuestionInput(false)}
          >
            <motion.form
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitUrgentQuestion}
              className="w-full max-w-sm bg-gray-800 rounded-2xl p-4 space-y-3 mb-16"
            >
              <p className="text-white font-semibold text-center">익명 긴급 질문</p>
              <p className="text-white/40 text-xs text-center">이름이 표시되지 않아요</p>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="질문을 입력하세요..."
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!questionText.trim()}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-40"
              >
                보내기
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm z-50"
          >
            질문이 전송되었습니다!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 p-3 flex gap-3 z-30">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleHand}
          className={`flex-1 py-3 rounded-xl font-semibold text-lg transition-colors ${
            isRaised ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'
          }`}
        >
          {isRaised ? '✋ 손 내리기' : '✋ 손들기'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestionInput(true)}
          className="flex-1 py-3 rounded-xl bg-red-600/80 text-white font-semibold text-lg"
        >
          ❓ 긴급 질문
        </motion.button>
      </div>
    </>
  );
}
