import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ThumbsUp, Check, HelpCircle } from 'lucide-react';
import { useClassQuestions } from '@/features/class-questions/api/useClassQuestions';
import { getParticipantId, getNickname, getLastSeen, saveLastSeen } from '@/lib/participant';
import { timeAgo } from '@/lib/utils';

const MAX_LENGTH = 200;

const QuestionCard = memo(function QuestionCard({ q, participantId, onUpvote, index = 0 }) {
  const hasUpvoted = q.upvotes?.[participantId];
  const isMine = q.participantId === participantId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`rounded-xl shadow-sm overflow-hidden ${q.answered ? 'opacity-50' : ''}`}
    >
      <div className={`p-4 bg-white dark:bg-slate-800 ${isMine && !q.answered ? 'ring-1 ring-slate-300 dark:ring-slate-600' : ''}`}>
        <p className="text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed">
          {q.text}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {q.nickname}
            </span>
            {isMine && (
              <span className="text-[10px] font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 px-1.5 py-0.5 rounded-md">나</span>
            )}
            <span className="text-[10px] text-slate-300 dark:text-slate-600">{timeAgo(q.timestamp)}</span>
            {q.answered && (
              <span className="flex items-center gap-0.5 text-slate-400 text-[10px] font-medium">
                <Check size={10} /> 답변 완료
              </span>
            )}
          </div>
          {!q.answered && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpvote(q.id)}
              aria-label={hasUpvoted ? '추천 취소' : '추천'}
              aria-pressed={!!hasUpvoted}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                hasUpvoted
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp size={12} />
              {q.upvoteCount || 0}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default memo(function ClassQAPanel({ sessionId, open, onClose, onNewQuestion }) {
  const { questions, unansweredCount, postQuestion, toggleUpvote, canPost, loading } =
    useClassQuestions(sessionId);
  const [inputText, setInputText] = useState('');
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const inputRef = useRef(null);
  const prevCountRef = useRef(getLastSeen(sessionId, 'qa'));

  // 패널 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const participantId = getParticipantId();
  const nickname = getNickname();

  // Notify parent of new questions when panel is closed
  useEffect(() => {
    if (loading) return;
    if (prevCountRef.current >= 0 && questions.length > prevCountRef.current && !open && onNewQuestion) {
      onNewQuestion();
    }
    prevCountRef.current = questions.length;
    if (open) saveLastSeen(sessionId, 'qa', questions.length);
  }, [questions.length, loading, open, onNewQuestion, sessionId]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handlePost() {
    const text = inputText.trim();
    if (!text || !canPost || posting) return;
    setPosting(true);
    const ok = await postQuestion(text, nickname, participantId);
    if (ok) setInputText('');
    setPosting(false);
  }

  function handleUpvote(questionId) {
    toggleUpvote(questionId, participantId);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-0 bottom-0 top-[10vh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:h-[600px] bg-slate-50 dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl sm:shadow-2xl z-50 flex flex-col overflow-hidden sm:border sm:border-slate-200 sm:dark:border-slate-700"
          >
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  수업 질문
                </span>
                {unansweredCount > 0 && (
                  <span className="text-xs text-slate-400">{unansweredCount}개</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                aria-label="수업 질문 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full">
                {[
                  { key: 'all', label: `전체 질문${questions.length > 0 ? ` (${questions.length})` : ''}` },
                  { key: 'mine', label: `내 질문${questions.filter((q) => q.participantId === participantId).length > 0 ? ` (${questions.filter((q) => q.participantId === participantId).length})` : ''}` },
                ].map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
                      tab === t.key ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-hide">
              {loading && questions.length === 0 && (
                <div className="flex-1 flex items-center justify-center h-full">
                  <span className="text-sm text-slate-300 dark:text-slate-500">불러오는 중...</span>
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {(() => {
                    const filtered = tab === 'mine' ? questions.filter((q) => q.participantId === participantId) : questions;
                    return filtered.length === 0 && !loading ? (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                          {tab === 'mine' ? '내가 올린 질문이 없습니다' : '아직 질문이 없습니다'}
                          <br /><span className="text-xs">수업에 대해 궁금한 점을 질문하세요</span>
                        </p>
                      </div>
                    ) : (
                      filtered.map((q, i) => (
                        <QuestionCard key={q.id} q={q} index={i} participantId={participantId} onUpvote={handleUpvote} />
                      ))
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
                placeholder="질문을 입력하세요"
                aria-label="수업 질문 입력"
                maxLength={MAX_LENGTH}
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-600 transition-colors duration-150"
              />
              <button
                onClick={handlePost}
                disabled={!inputText.trim() || !canPost || posting}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150 shrink-0"
                aria-label="질문 보내기"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
