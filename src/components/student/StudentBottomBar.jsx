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
            className="fixed inset-0 bg-black/40 z-40 flex items-end justify-center p-4"
            onClick={() => setShowQuestionInput(false)}
          >
            <motion.form
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitUrgentQuestion}
              className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4 mb-16"
            >
              <div className="text-center space-y-1">
                <p className="text-gray-900 font-bold text-lg">익명 긴급 질문</p>
                <p className="text-gray-400 text-xs">이름이 표시되지 않아요</p>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="질문을 입력하세요..."
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                autoFocus
              />
              <motion.button
                type="submit"
                disabled={!questionText.trim()}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold disabled:opacity-30 shadow-sm transition-all"
              >
                보내기
              </motion.button>
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium z-50 shadow-sm"
          >
            질문이 전송되었습니다!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-30">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleHand}
          className={`flex-1 py-3.5 rounded-xl font-bold text-base transition-all ${
            isRaised
              ? 'bg-amber-100 text-amber-700 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isRaised ? '✋ 손 내리기' : '✋ 손들기'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestionInput(true)}
          className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-all"
        >
          ❓ 긴급 질문
        </motion.button>
      </div>
    </>
  );
}
