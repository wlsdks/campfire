import { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname } from '@/lib/participant';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ReactionBar from '@/features/reactions/components/ReactionBar';

export default function StudentBottomBar({ sessionId }) {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { handRaises } = useHandRaises(sessionId);

  const pid = getParticipantId();
  const isRaised = handRaises[pid]?.raised === true;

  async function toggleHand() {
    try {
      const handRef = ref(db, `sessions/${sessionId}/handRaises/${pid}`);
      if (isRaised) {
        await set(handRef, { nickname: getNickname(), raised: false, raisedAt: null });
      } else {
        await set(handRef, { nickname: getNickname(), raised: true, raisedAt: serverTimestamp() });
      }
    } catch (err) {
      console.error('Toggle hand failed:', err);
    }
  }

  async function submitUrgentQuestion(e) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitError(null);
    try {
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
    } catch (err) {
      console.error('Submit question failed:', err);
      setSubmitError('전송에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setSubmitError(null), 3000);
    }
  }

  return (
    <>
      {/* Question modal */}
      <Modal open={showQuestionInput} onClose={() => setShowQuestionInput(false)}>
        <form onSubmit={submitUrgentQuestion} className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-2">
              <MessageCircle size={20} className="text-indigo-600" />
            </div>
            <p className="text-slate-900 font-bold text-lg">익명 긴급 질문</p>
            <p className="text-slate-400 text-xs">이름이 표시되지 않습니다</p>
          </div>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="질문을 입력하세요..."
            maxLength={300}
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
            autoFocus
          />
          <Button type="submit" variant="primary" size="lg" disabled={!questionText.trim()} className="w-full">
            <Send size={16} />
            보내기
          </Button>
        </form>
      </Modal>

      {/* Success toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={16} />
            질문이 전송되었습니다
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2.5 z-30 space-y-2">
        <ReactionBar sessionId={sessionId} />
        <div className="flex gap-2.5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleHand}
          className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            isRaised
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Hand size={18} />
          {isRaised ? '손 내리기' : '손들기'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestionInput(true)}
          className="flex-1 py-3 rounded-lg bg-slate-50 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-transparent"
        >
          <MessageCircle size={18} />
          긴급 질문
        </motion.button>
        </div>
      </div>
    </>
  );
}
