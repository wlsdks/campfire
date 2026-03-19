import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Check, ChevronDown, Circle, Cloud, Copy, MessageSquare, Play, Square, Trash2, Trophy } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import PinggoMascot from '@/components/ui/PinggoMascot';
import { isQuizQuestion } from '@/lib/quiz';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

export default function QuestionList({
  questionList,
  currentQuestion,
  onActivate,
  onReveal,
  onShowLeaderboard,
  onClearActive,
  onDuplicate,
  onDelete,
  readOnly = false,
  onView,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = questionList.filter(([qId]) => qId === currentQuestion).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">추가된 문항 {questionList.length}개</span>
          {activeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />}
        </div>
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>

      {/* Question items */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-1.5 space-y-1.5">
              {questionList.map(([qId, q]) => {
                const qType = QUESTION_TYPES.find((t) => t.value === q.type);
                const Icon = qType?.icon || MessageSquare;
                const isActive = currentQuestion === qId;
                const isQuiz = isQuizQuestion(q);

                return (
                  <motion.div
                    key={qId}
                    layout
                    onClick={readOnly && onView ? () => onView(qId) : undefined}
                    className={`p-3 rounded-xl border transition-all ${
                      readOnly
                        ? `bg-white ${currentQuestion === qId ? 'border-slate-400 shadow-sm' : 'border-slate-200 hover:border-slate-300 cursor-pointer'}`
                        : isActive ? 'bg-white border-slate-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon size={12} className={!readOnly && isActive ? 'text-slate-700' : 'text-slate-400'} />
                          <span className={`text-xs font-medium ${!readOnly && isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                            {qType?.label}
                          </span>
                          {!readOnly && isActive && <Badge variant="primary">LIVE</Badge>}
                          {isQuiz && q.event && <Badge variant="neutral">{q.event.label || '이벤트'}</Badge>}
                          {isQuiz && q.revealedAt && <Badge variant="neutral">정답 공개</Badge>}
                        </div>
                        <span className="text-slate-700 text-sm leading-snug">{q.title}</span>
                        {readOnly && q.votes && (
                          <span className="text-slate-400 text-xs ml-1">
                            ({Object.keys(q.votes).length}명 응답)
                          </span>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="flex gap-1 shrink-0">
                          {!isActive ? (
                            <button
                              onClick={() => onActivate(qId)}
                              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white transition-all"
                              title="활성화"
                              aria-label="질문 활성화"
                            >
                              <Play size={12} />
                            </button>
                          ) : (
                            <>
                              {isQuiz && !q.revealedAt && (
                                <button
                                  onClick={() => onReveal(qId)}
                                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white transition-all"
                                  title="정답 공개"
                                  aria-label="정답 공개"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                              {isQuiz && q.revealedAt && (
                                <button
                                  onClick={onShowLeaderboard}
                                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white transition-all"
                                  title="리더보드 보기"
                                  aria-label="리더보드 보기"
                                >
                                  <Trophy size={12} />
                                </button>
                              )}
                              <button
                                onClick={onClearActive}
                                className="p-1.5 rounded-md bg-slate-200 text-slate-500 hover:bg-slate-300 transition-all"
                                title="중지"
                                aria-label="질문 중지"
                              >
                                <Square size={12} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onDuplicate(qId)}
                            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-200 hover:text-slate-600 transition-all"
                            title="복제"
                            aria-label="질문 복제"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => onDelete(qId)}
                            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-200 hover:text-slate-700 transition-all"
                            title="삭제"
                            aria-label="질문 삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {questionList.length === 0 && (
                <div className="flex flex-col items-center text-center py-6 space-y-2">
                  <PinggoMascot size="sm" mood="waiting" />
                  <p className="text-slate-400 text-sm font-medium">아직 질문이 없습니다</p>
                  <p className="text-slate-300 text-xs">위의 + 추가 버튼으로 첫 질문을 만들어보세요</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
