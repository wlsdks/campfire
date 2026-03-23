import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useClassQuestions } from '@/features/class-questions/api/useClassQuestions';
import { getParticipantId, getNickname } from '@/lib/participant';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/utils';

/**
 * Q&A Board — full-screen view for class questions + answers.
 * Desktop: 2-column grid. Mobile: single-column feed.
 * Tabs: 수업 중 / 사후 질문.
 *
 * Used in: PresentationView, LivePage, and student WaitingPage (via mode).
 */
export default function ClassQABoard({ sessionId, showInput = true }) {
  const {
    questions, unansweredCount, postQuestion, toggleUpvote, postAnswer, toggleAnswerUpvote, canPost,
  } = useClassQuestions(sessionId);

  const [tab, setTab] = useState('all');
  const [inputText, setInputText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const pid = getParticipantId();
  const nickname = getNickname() || '익명';
  const displayName = anonymous ? '익명' : nickname;

  const filtered = useMemo(() => {
    if (tab === 'all') return questions;
    if (tab === 'unanswered') return questions.filter((q) => !q.answered);
    return questions;
  }, [questions, tab]);

  const handlePostQuestion = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const success = await postQuestion(trimmed, displayName, anonymous ? '' : pid);
    if (success) setInputText('');
  }, [inputText, postQuestion, displayName, anonymous, pid]);

  if (questions.length === 0 && !showInput) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <EmptyState
          title="아직 질문이 없습니다"
          description="학생들이 질문을 보내면 여기에 표시됩니다"
          mascotSize="md"
          mood="waiting"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Q&A 보드
          {questions.length > 0 && (
            <span className="ml-2 text-lg font-normal text-slate-400">{questions.length}개</span>
          )}
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {[
            { key: 'all', label: '전체', count: questions.length },
            { key: 'unanswered', label: '미답변', count: unansweredCount },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.label}{t.count > 0 ? ` ${t.count}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Question input */}
      {showInput && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostQuestion()}
              placeholder="궁금한 점을 자유롭게 질문하세요"
              maxLength={200}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
            />
            <Button
              onClick={handlePostQuestion}
              disabled={!inputText.trim() || !canPost}
              variant="primary"
              size="md"
            >
              <Send size={16} />
            </Button>
          </div>
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                anonymous ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                anonymous ? 'bg-slate-900 border-slate-900 dark:bg-slate-100 dark:border-slate-100' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {anonymous && <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white dark:text-slate-900"><path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              익명으로 질문
            </button>
            {!canPost && (
              <span className="text-xs text-slate-400">잠시 후 다시 질문할 수 있어요</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Questions grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            {tab === 'unanswered' ? '미답변 질문이 없습니다' : '아직 질문이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                pid={pid}
                nickname={nickname}
                sessionId={sessionId}
                onUpvote={toggleUpvote}
                onPostAnswer={postAnswer}
                onAnswerUpvote={toggleAnswerUpvote}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question: q, index, pid, nickname, onUpvote, onPostAnswer, onAnswerUpvote }) {
  const [expanded, setExpanded] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const isOwn = q.participantId === pid;
  const hasUpvoted = q.upvotes?.[pid];

  async function handlePostAnswer() {
    if (!answerText.trim() || posting) return;
    setPosting(true);
    const success = await onPostAnswer(q.id, answerText.trim(), nickname, pid);
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
      className={`bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-opacity duration-300 ${
        q.answered ? 'opacity-60' : ''
      }`}
    >
      <div className="flex">
        {/* Upvote column — big number, always visible */}
        <button
          onClick={() => onUpvote(q.id, pid)}
          className="flex flex-col items-center justify-center gap-1 shrink-0 w-[56px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ThumbsUp size={15} className={`transition-colors ${hasUpvoted ? 'text-slate-900 dark:text-slate-100 fill-current' : 'text-slate-400 dark:text-slate-500'}`} />
          <span className={`text-base font-bold tabular-nums ${
            q.upvoteCount > 0
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500'
          }`}>{q.upvoteCount}</span>
        </button>

        {/* Content column */}
        <div className="flex-1 min-w-0 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                {q.nickname}
              </span>
              {isOwn && <Badge variant="neutral">나</Badge>}
              {q.answered && <Badge variant="neutral">답변 완료</Badge>}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(q.timestamp)}</span>
          </div>

          <p className="text-sm md:text-base text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">{q.text}</p>

          {/* Answer toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <MessageSquare size={13} />
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
                  className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors hover:bg-slate-800 dark:hover:bg-slate-200"
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

function AnswerItem({ answer: a, questionId, pid, onUpvote }) {
  const isOwn = a.participantId === pid;
  const hasUpvoted = a.upvotes?.[pid];

  return (
    <div className="flex gap-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{a.nickname}</span>
          {isOwn && <span className="text-[10px] text-slate-400">나</span>}
          <span className="text-[10px] text-slate-400">{timeAgo(a.timestamp)}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">{a.text}</p>
        <button
          onClick={() => onUpvote(questionId, a.id, pid)}
          className={`flex items-center gap-1 mt-1 text-xs transition-colors ${
            hasUpvoted
              ? 'text-slate-900 dark:text-slate-100 font-semibold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <ThumbsUp size={11} className={hasUpvoted ? 'fill-current' : ''} />
          {a.upvoteCount > 0 && <span className="tabular-nums">{a.upvoteCount}</span>}
        </button>
      </div>
    </div>
  );
}
