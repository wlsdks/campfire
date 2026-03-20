import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ChevronUp, Check, HelpCircle } from 'lucide-react';
import { useClassQuestions } from '@/features/class-questions/api/useClassQuestions';
import { getParticipantId, getNickname } from '@/lib/participant';

const MAX_LENGTH = 200;

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function QuestionCard({ q, participantId, onUpvote }) {
  const hasUpvoted = q.upvotes?.[participantId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
      className={`p-3.5 rounded-xl border transition-colors ${
        q.answered
          ? 'bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700 opacity-70'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
        {q.text}
      </p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{q.nickname}</span>
          <span className="text-[10px] text-slate-300 dark:text-slate-500">
            {timeAgo(q.timestamp)}
          </span>
          {q.answered && (
            <span className="flex items-center gap-0.5 text-emerald-500 text-[10px] font-medium">
              <Check size={10} />
              답변 완료
            </span>
          )}
        </div>
        {!q.answered && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpvote(q.id)}
            aria-label={hasUpvoted ? '추천 취소' : '추천'}
            aria-pressed={!!hasUpvoted}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              hasUpvoted
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <ChevronUp size={14} />
            {q.upvoteCount || 0}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function ClassQAPanel({ sessionId, open, onClose, onNewQuestion }) {
  const { questions, unansweredCount, postQuestion, toggleUpvote, canPost, loading } =
    useClassQuestions(sessionId);
  const [inputText, setInputText] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);
  const prevCountRef = useRef(0);

  const participantId = getParticipantId();
  const nickname = getNickname();

  // Notify parent of new questions when panel is closed
  useEffect(() => {
    if (questions.length > prevCountRef.current && !open && onNewQuestion) {
      onNewQuestion();
    }
    prevCountRef.current = questions.length;
  }, [questions.length, open, onNewQuestion]);

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
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:h-[600px] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                aria-label="수업 질문 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-hide">
              {loading && questions.length === 0 && (
                <div className="flex-1 flex items-center justify-center h-full">
                  <span className="text-sm text-slate-300 dark:text-slate-500">
                    불러오는 중...
                  </span>
                </div>
              )}
              {!loading && questions.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-300 dark:text-slate-500 text-center leading-relaxed">
                    아직 질문이 없습니다
                    <br />
                    <span className="text-xs">
                      수업에 대해 궁금한 점을 질문하세요
                    </span>
                  </p>
                </div>
              )}
              <AnimatePresence>
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    participantId={participantId}
                    onUpvote={handleUpvote}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
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
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
              />
              <button
                onClick={handlePost}
                disabled={!inputText.trim() || !canPost || posting}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0"
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
}
