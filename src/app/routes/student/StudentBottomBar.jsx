import { useState, useCallback } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname, getLastSeen, saveLastSeen } from '@/lib/participant';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { useStudentDM } from '@/features/dm/api/useDM';
import { motion } from 'framer-motion';
import { Hand, MessageCircle, MessageSquare, HelpCircle, Headset, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ReactionBar from '@/features/reactions/components/ReactionBar';
import ReactionOverlay from '@/features/reactions/components/ReactionOverlay';
import ChatPanel from '@/features/chat/components/ChatPanel';
import ClassQAPanel from '@/features/class-questions/components/ClassQAPanel';
import DMBubble from '@/features/dm/components/DMBubble';
import StudentToasts from '@/app/routes/student/StudentToasts';
import { timing } from '@/lib/design-tokens';

const UNREAD_DOT = 'absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full animate-pulse';
const BTN = 'h-[56px] rounded-xl bg-slate-50 text-slate-600 font-medium text-sm active:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:active:bg-slate-600 transition-all flex flex-col items-center justify-center gap-1';

export default function StudentBottomBar({ sessionId }) {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [showDMChat, setShowDMChat] = useState(false);
  const [dmLastSeen, setDmLastSeen] = useState(() => getLastSeen(sessionId, 'dm') >= 0 ? getLastSeen(sessionId, 'dm') : 0);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasNewQuestion, setHasNewQuestion] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { handRaises } = useHandRaises(sessionId);

  const pid = getParticipantId();
  const nickname = getNickname() || '익명';
  const { activeDM, allActiveDMs, sendMessage: sendDMMessage, requestHelp } = useStudentDM(sessionId, pid);
  const isRaised = handRaises[pid]?.raised === true;

  const totalDMMessages = allActiveDMs.reduce((sum, dm) => sum + (dm.messageList?.length || 0), 0);
  const dmUnread = Math.max(0, totalDMMessages - dmLastSeen);

  const handleNewMessage = useCallback(() => setHasUnread(true), []);
  const handleNewQuestion = useCallback(() => setHasNewQuestion(true), []);
  const handleHelpRequest = useCallback(async (text) => requestHelp(text, nickname), [requestHelp, nickname]);

  async function toggleHand() {
    try {
      const handRef = ref(db, `sessions/${sessionId}/handRaises/${pid}`);
      await set(handRef, isRaised
        ? { nickname: getNickname(), raised: false, raisedAt: null }
        : { nickname: getNickname(), raised: true, raisedAt: serverTimestamp() }
      );
    } catch (err) { console.error('Toggle hand failed:', err); }
  }

  async function submitUrgentQuestion(e) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitError(null);
    try {
      await push(ref(db, `sessions/${sessionId}/urgentQuestions`), { text: questionText.trim(), timestamp: serverTimestamp(), read: false });
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
      <ChatPanel sessionId={sessionId} senderName={nickname} senderType="student" open={showChat} onClose={() => setShowChat(false)} onNewMessage={handleNewMessage} />
      <ClassQAPanel sessionId={sessionId} open={showQA} onClose={() => setShowQA(false)} onNewQuestion={handleNewQuestion} />
      {showDMChat && (
        <DMBubble
          activeDMs={allActiveDMs}
          activeDM={activeDM}
          senderName={nickname}
          onSendMessage={sendDMMessage}
          onClose={() => setShowDMChat(false)}
          onRequestHelp={handleHelpRequest}
        />
      )}

      <Modal open={showQuestionInput} onClose={() => setShowQuestionInput(false)} ariaLabel="익명 긴급 질문">
        <form onSubmit={submitUrgentQuestion} className="space-y-4">
          <div className="text-center space-y-1">
            <MessageCircle size={24} className="text-slate-900 dark:text-slate-100 mx-auto mb-2" />
            <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">익명 긴급 질문</p>
            <p className="text-slate-400 text-xs">이름이 표시되지 않습니다</p>
          </div>
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="질문을 입력하세요..." aria-label="긴급 질문 내용" maxLength={300} rows={3} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-300/15 focus:border-slate-400 resize-none transition-all" autoFocus />
          <Button type="submit" variant="primary" size="lg" disabled={!questionText.trim()} className="w-full"><Send size={16} />보내기</Button>
        </form>
      </Modal>

      <StudentToasts submitted={submitted} submitError={submitError} />

      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }} role="toolbar" aria-label="참여 도구" className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 z-30">
        <div className="max-w-[620px] mx-auto px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ReactionBar sessionId={sessionId} />
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-5 gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={toggleHand} aria-pressed={isRaised} className={`h-[56px] rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center gap-0.5 ${isRaised ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : BTN.replace('bg-white ', '')}`}>
                <motion.div animate={isRaised ? { rotate: [0, -15, 15, -10, 10, 0] } : { rotate: 0 }} transition={isRaised ? { duration: 0.6, repeat: Infinity, repeatDelay: 2 } : {}}>
                  <Hand size={22} />
                </motion.div>
                <span className="text-[11px]">{isRaised ? '내리기' : '손들기'}</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowQuestionInput(true)} className={BTN}>
                <MessageCircle size={22} /><span className="text-[11px]">긴급</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowQA(true); setHasNewQuestion(false); }} className={`${BTN} relative`}>
                <HelpCircle size={22} /><span className="text-[11px]">질문</span>
                {hasNewQuestion && <span className={`${UNREAD_DOT} bg-red-500`} />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowChat(true); setHasUnread(false); }} className={`${BTN} relative`}>
                <MessageSquare size={22} /><span className="text-[11px]">채팅</span>
                {hasUnread && <span className={`${UNREAD_DOT} bg-red-500`} />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
                setShowDMChat(true); setDmLastSeen(totalDMMessages); saveLastSeen(sessionId, 'dm', totalDMMessages);
              }} className={`${BTN} relative`}>
                <Headset size={22} /><span className="text-[11px]">도움</span>
                {dmUnread > 0 && (
                  <span className={`${UNREAD_DOT} bg-red-500 flex items-center justify-center`}>
                    <span className="text-white text-[8px] font-bold">{dmUnread}</span>
                  </span>
                )}
                {allActiveDMs.length > 0 && dmUnread === 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
