import { motion } from 'framer-motion';
import { BarChart3, Check, Circle, Cloud, Copy, MessageSquare, Play, Square, Trash2, Trophy } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { isQuizQuestion } from '@/lib/quiz';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

/**
 * Renders the list of existing questions with action buttons.
 * Presentational component — all actions delegated to parent via callbacks.
 *
 * @param {Object} props
 * @param {Array<[string, Object]>} props.questionList - Sorted entries of [qId, questionData]
 * @param {string|null} props.currentQuestion - Currently active question ID
 * @param {(qId: string) => void} props.onActivate
 * @param {(qId: string) => void} props.onReveal
 * @param {() => void} props.onShowLeaderboard
 * @param {() => void} props.onClearActive
 * @param {(qId: string) => void} props.onDuplicate
 * @param {(qId: string) => void} props.onDelete
 */
export default function QuestionList({
  questionList,
  currentQuestion,
  onActivate,
  onReveal,
  onShowLeaderboard,
  onClearActive,
  onDuplicate,
  onDelete,
}) {
  return (
    <div className="space-y-1.5">
      {questionList.map(([qId, q]) => {
        const qType = QUESTION_TYPES.find((t) => t.value === q.type);
        const Icon = qType?.icon || MessageSquare;
        const isActive = currentQuestion === qId;
        const isQuiz = isQuizQuestion(q);

        return (
          <motion.div
            key={qId}
            layout
            className={`p-3 rounded-xl border transition-all ${
              isActive ? 'bg-white border-slate-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={12} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                  <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {qType?.label}
                  </span>
                  {isActive && <Badge variant="primary">LIVE</Badge>}
                  {isQuiz && q.event && <Badge variant="neutral">{q.event.label || '이벤트'}</Badge>}
                  {isQuiz && q.revealedAt && <Badge variant="neutral">정답 공개</Badge>}
                </div>
                <span className="text-slate-700 text-sm leading-snug">{q.title}</span>
              </div>

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
            </div>
          </motion.div>
        );
      })}

      {questionList.length === 0 && (
        <div className="text-center py-8 space-y-1.5">
          <BarChart3 size={24} className="text-slate-300 mx-auto" />
          <p className="text-slate-400 text-sm">아직 질문이 없습니다</p>
          <p className="text-slate-300 text-xs">위의 + 추가 버튼으로 질문을 만드세요</p>
        </div>
      )}
    </div>
  );
}
