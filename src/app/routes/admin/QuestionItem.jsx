import { memo, useState, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Tooltip from '@/components/ui/Tooltip';
import { GripVertical, BookmarkPlus, Check, Copy, MessageSquare, Pencil, Play, Square, Trash2, Trophy, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { isQuizQuestion } from '@/lib/quiz';
import { QUESTION_TYPES } from '@/lib/question-types';

const primaryBtnClass = 'p-2 sm:p-2.5 lg:p-1.5 rounded-lg sm:rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white transition-colors duration-150 active:scale-90';
const stopBtnClass = 'p-2 sm:p-2.5 lg:p-1.5 rounded-lg sm:rounded-md bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-150 active:scale-90';

/** Button with brief loading feedback to prevent double-clicks. */
function ActionButton({ onClick, className, children, 'aria-label': ariaLabel, feedbackMs = 600 }) {
  const [busy, setBusy] = useState(false);
  const handle = useCallback(() => {
    if (busy) return;
    setBusy(true);
    onClick?.();
  }, [busy, onClick]);
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), feedbackMs);
    return () => clearTimeout(t);
  }, [busy, feedbackMs]);
  return (
    <button onClick={handle} className={className} aria-label={ariaLabel} disabled={busy}>
      {busy ? <Loader2 size={typeof children?.props?.size === 'number' ? children.props.size : 14} className="animate-spin" /> : children}
    </button>
  );
}

/** Shared question item UI — used both sortable (desktop) and static (mobile/readOnly). */
export function QuestionItemContent({ qId, q, currentQuestion, readOnly, onView, onActivate, onReveal, onRevealAnswer, onShowLeaderboard, onClearActive, onEdit, onDuplicate, onDelete, onSaveToLibrary, isDragging = false, dragProps = {} }) {
  const qType = QUESTION_TYPES.find((t) => t.value === q.type);
  const Icon = qType?.icon || MessageSquare;
  const isActive = currentQuestion === qId;
  const isQuiz = isQuizQuestion(q);
  const isMH = ['mysteryBox', 'hintQuiz'].includes(q.type);
  const hasAnswer = !isQuiz && q.correctAnswer;
  const hasReveal = isQuiz || hasAnswer;
  const handleReveal = () => isQuiz ? onReveal?.(qId) : onRevealAnswer?.(qId);
  const stopDrag = (e) => e.stopPropagation();

  return (
    <div
      {...dragProps}
      onClick={readOnly && onView ? () => onView(qId) : undefined}
      className={`p-4 sm:p-3.5 rounded-xl border transition-colors duration-150 group ${
        isDragging ? 'shadow-lg opacity-80 scale-[1.03] bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 cursor-grabbing touch-none' :
        readOnly
          ? `bg-white dark:bg-slate-800 ${currentQuestion === qId ? 'border-slate-400 dark:border-slate-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'}`
          : isActive ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500 shadow-sm sm:cursor-grab' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 sm:cursor-grab'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag indicator — desktop only */}
        {!readOnly && (
          <div className="shrink-0 -ml-1 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors duration-150 pt-0.5 cursor-grab active:cursor-grabbing max-sm:hidden">
            <GripVertical size={14} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 sm:mb-1">
            <Icon size={13} className={!readOnly && isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'} />
            <span className={`text-xs font-semibold ${!readOnly && isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
              {qType?.label}
            </span>
            {!readOnly && isActive && <Badge variant="primary">LIVE</Badge>}
            {isQuiz && q.betting && <Badge variant="neutral">베팅</Badge>}
            {isQuiz && q.event && <Badge variant="neutral">{q.event.label || '이벤트'}</Badge>}
            {hasReveal && q.revealedAt && <Badge variant="neutral">정답 공개</Badge>}
          </div>
          <span className="text-slate-700 dark:text-slate-200 text-[15px] sm:text-sm leading-snug">{q.title}</span>
          {readOnly && q.votes && (
            <span className="text-slate-400 text-xs ml-1">({Object.keys(q.votes).length}명 응답)</span>
          )}
        </div>

        {/* Desktop: compact buttons */}
        {!readOnly && (
          <div className="hidden sm:flex gap-1 shrink-0" onPointerDown={stopDrag}>
            {!isActive ? (
              <Tooltip label="질문 활성화"><ActionButton onClick={() => onActivate(qId)} className={primaryBtnClass} aria-label="질문 활성화">
                <Play size={12} />
              </ActionButton></Tooltip>
            ) : (
              <>
                {hasReveal && !q.revealedAt && (
                  <Tooltip label="정답 공개"><ActionButton onClick={handleReveal} className={primaryBtnClass} aria-label="정답 공개">
                    <Check size={12} />
                  </ActionButton></Tooltip>
                )}
                {isQuiz && q.revealedAt && (
                  <Tooltip label="리더보드 보기"><ActionButton onClick={onShowLeaderboard} className={primaryBtnClass} aria-label="리더보드 보기">
                    <Trophy size={12} />
                  </ActionButton></Tooltip>
                )}
                <Tooltip label="질문 중지"><ActionButton onClick={onClearActive} className={stopBtnClass} aria-label="질문 중지">
                  <Square size={12} />
                </ActionButton></Tooltip>
              </>
            )}
            {onSaveToLibrary && (
              <Tooltip label="보관함에 저장"><button onClick={() => onSaveToLibrary(qId)} className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-150 active:scale-90" aria-label="보관함에 저장">
                <BookmarkPlus size={12} />
              </button></Tooltip>
            )}
            {onEdit && (
              <Tooltip label="질문 수정"><button onClick={() => onEdit(qId)} className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-150 active:scale-90" aria-label="질문 수정">
                <Pencil size={12} />
              </button></Tooltip>
            )}
            <Tooltip label="질문 복제"><button onClick={() => onDuplicate(qId)} className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-150 active:scale-90" aria-label="질문 복제">
              <Copy size={12} />
            </button></Tooltip>
            <Tooltip label="질문 삭제"><button onClick={() => onDelete(qId)} className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150 active:scale-90" aria-label="질문 삭제">
              <Trash2 size={12} />
            </button></Tooltip>
          </div>
        )}
      </div>

      {/* Mobile: action buttons row below content */}
      {!readOnly && (
        <div className="flex gap-2 mt-3 sm:hidden">
          {!isActive ? (
            <>
              <ActionButton onClick={() => onActivate(qId)} className={`flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-sm font-semibold active:scale-[0.96] ${primaryBtnClass}`} aria-label="질문 활성화">
                <Play size={16} /> 시작
              </ActionButton>
              {onEdit && (
                <button onClick={() => onEdit(qId)} className={`flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-xl text-sm font-medium active:scale-[0.96] ${stopBtnClass}`} aria-label="질문 수정">
                  <Pencil size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              {hasReveal && !q.revealedAt && (
                <ActionButton onClick={handleReveal} className={`flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-sm font-semibold active:scale-[0.96] ${primaryBtnClass}`} aria-label="정답 공개">
                  <Check size={16} /> 정답 공개
                </ActionButton>
              )}
              {isQuiz && q.revealedAt && (
                <ActionButton onClick={onShowLeaderboard} className={`flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-sm font-semibold active:scale-[0.96] ${primaryBtnClass}`} aria-label="리더보드">
                  <Trophy size={16} /> 리더보드
                </ActionButton>
              )}
              <ActionButton onClick={onClearActive} className={`flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-sm font-semibold active:scale-[0.96] ${stopBtnClass}`} aria-label="중지">
                <Square size={16} /> 중지
              </ActionButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const SortableItem = memo(function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.qId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionItemContent {...props} isDragging={isDragging} dragProps={{ ...attributes, ...listeners, className: 'touch-none' }} />
    </div>
  );
});
