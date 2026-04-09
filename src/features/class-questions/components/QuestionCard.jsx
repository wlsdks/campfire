import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageSquare, Send, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import AnswerItem from './AnswerItem';

export default function QuestionCard({ question: q, index, pid, nickname, role, onUpvote, onPostAnswer, onAnswerUpvote }) {
  const [expanded, setExpanded] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const isOwn = q.participantId === pid;
  const hasUpvoted = q.upvotes?.[pid];

  async function handlePostAnswer() {
    if (!answerText.trim() || posting) return;
    setPosting(true);
    const success = await onPostAnswer(q.id, answerText.trim(), nickname, pid, role);
    if (success) setAnswerText('');
    setPosting(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.03 }}
      className={`rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
        q.answeredByRole ? 'bg-white dark:bg-slate-800 ring-1 ring-emerald-200 dark:ring-emerald-800/50' : 'bg-white dark:bg-slate-800'
      }`}
    >
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {q.nickname}
            </span>
            {isOwn && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">나</span>}
            {q.answeredByRole && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Check size={10} />
                {q.answeredByRole === 'staff' ? '스태프 답변' : '강사 답변'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(q.timestamp)}</span>
        </div>

        <p className="text-sm md:text-base text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">{q.text}</p>

        {/* Actions row */}
        <div className="flex items-center gap-4 pt-0.5">
          <button
            onClick={() => onUpvote(q.id, pid)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${
              hasUpvoted
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <ThumbsUp size={15} className={hasUpvoted ? 'fill-current' : ''} />
            <span className="tabular-nums font-bold">{q.upvoteCount}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
          >
            <MessageSquare size={14} />
            <span>{q.answerCount > 0 ? `답변 ${q.answerCount}개` : '답변하기'}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Answers section (expandable) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 space-y-3">
              {/* Full question text (visible when expanded) */}
              {q.text.length > 60 && (
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed pb-2 border-b border-slate-100 dark:border-slate-700">{q.text}</p>
              )}
              {/* Existing answers */}
              {q.answerList.length > 0 ? (
                q.answerList.map((a) => (
                  <AnswerItem
                    key={a.id}
                    answer={a}
                    questionId={q.id}
                    pid={pid}
                    onUpvote={onAnswerUpvote}
                  />
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">아직 답변이 없습니다</p>
              )}

              {/* Answer input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostAnswer()}
                  placeholder="답변 작성..."
                  maxLength={500}
                  className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={handlePostAnswer}
                  disabled={!answerText.trim() || posting}
                  className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors duration-150 hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
