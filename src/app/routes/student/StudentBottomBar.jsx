import { useState, useCallback } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname } from '@/lib/participant';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, MessageCircle, MessageSquare, HelpCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ReactionBar from '@/features/reactions/components/ReactionBar';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import ChatPanel from '@/features/chat/components/ChatPanel';
import ClassQAPanel from '@/features/class-questions/components/ClassQAPanel';
import { timing } from '@/lib/design-tokens';

export default function StudentBottomBar({ sessionId }) {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasNewQuestion, setHasNewQuestion] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { handRaises } = useHandRaises(sessionId);

  const handleOpenChat = () => {
    setShowChat(true);
    setHasUnread(false);
  };

  const handleOpenQA = () => {
    setShowQA(true);
    setHasNewQuestion(false);
  };

  const handleNewMessage = useCallback(() => {
    setHasUnread(true);
  }, []);

  const handleNewQuestion = useCallback(() => {
    setHasNewQuestion(true);
  }, []);

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
      setTimeout(() => setSubmitted(false), timing.successToastDuration);
    } catch (err) {
      console.error('Submit question failed:', err);
      setSubmitError('전송에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setSubmitError(null), 3000);
    }
  }

  return (
    <>
      <ReactionOverlay sessionId={sessionId} />

      {/* Chat panel */}
      <ChatPanel
        sessionId={sessionId}
        senderName={getNickname() || '익명'}
        senderType="student"
        open={showChat}
        onClose={() => setShowChat(false)}
        onNewMessage={handleNewMessage}
      />

      {/* Class Q&A panel */}
      <ClassQAPanel
        sessionId={sessionId}
        open={showQA}
        onClose={() => setShowQA(false)}
        onNewQuestion={handleNewQuestion}
      />

      {/* Question modal */}
      <Modal open={showQuestionInput} onClose={() => setShowQuestionInput(false)} ariaLabel="익명 긴급 질문">
        <form onSubmit={submitUrgentQuestion} className="space-y-4">
          <div className="text-center space-y-1">
            <MessageCircle size={24} className="text-slate-900 dark:text-slate-100 mx-auto mb-2" />
            <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">익명 긴급 질문</p>
            <p className="text-slate-400 text-xs">이름이 표시되지 않습니다</p>
          </div>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="질문을 입력하세요..."
            aria-label="긴급 질문 내용"
            maxLength={300}
            rows={3}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 focus:border-orange-500 resize-none transition-all"
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
            role="status"
            aria-live="polite"
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
            role="alert"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
        role="toolbar"
        aria-label="참여 도구"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30">
        <div className="max-w-lg mx-auto px-4 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <ReactionBar sessionId={sessionId} />
        <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2">
          <div className="grid grid-cols-4 gap-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleHand}
              aria-pressed={isRaised}
              className={`h-11 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1 ${
                isRaised
                  ? 'bg-orange-600 text-white dark:bg-orange-500'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <Hand size={15} />
              {isRaised ? '내리기' : '손들기'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuestionInput(true)}
              className="h-11 rounded-lg bg-slate-50 text-slate-600 font-medium text-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1"
            >
              <MessageCircle size={15} />
              긴급
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenQA}
              className="h-11 rounded-lg bg-slate-50 text-slate-600 font-medium text-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1 relative"
            >
              <HelpCircle size={15} />
              질문
              {hasNewQuestion && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenChat}
              className="h-11 rounded-lg bg-slate-50 text-slate-600 font-medium text-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1 relative"
            >
              <MessageSquare size={15} />
              채팅
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </motion.button>
          </div>
        </div>
        </div>
      </motion.div>
    </>
  );
}
