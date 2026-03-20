import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState, useCallback, useMemo, memo } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import VoteConfirm from './VoteConfirm';

/**
 * Deterministic shuffle based on questionId + participantId.
 * Produces a consistent order per student so refreshes don't reshuffle.
 */
function shuffleWithSeed(items, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const arr = items.map((item, i) => ({ item, i }));
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((a) => a.i);
}

function SortableRankItem({ id, label, position }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white dark:bg-slate-800 touch-none transition-all ${
        isDragging
          ? 'shadow-lg border-slate-300 scale-[1.02] cursor-grabbing'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-grab active:scale-[0.98]'
      }`}
    >
      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
        {position}
      </span>
      <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug select-none">{label}</span>
      <GripVertical size={16} className="text-slate-300 shrink-0" />
    </div>
  );
}

export default memo(function RankingVoter({ sessionId, questionId, options = [], disabled = false }) {
  const pid = getParticipantId();

  // Shuffle items deterministically per student
  const initialOrder = useMemo(() => {
    const seed = `${questionId}-${pid}`;
    return shuffleWithSeed(options, seed);
  }, [questionId, options, pid]);

  const [order, setOrder] = useState(initialOrder);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const sortableIds = useMemo(() => order.map((idx) => `rank-${idx}`), [order]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortableIds.indexOf(active.id);
    const newIdx = sortableIds.indexOf(over.id);
    setOrder((prev) => arrayMove(prev, oldIdx, newIdx));
  }, [sortableIds]);

  const handleSubmit = useCallback(async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value: order.join(','),
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Ranking vote failed:', err);
      setSubmitting(false);
    }
  }, [sessionId, questionId, order, pid, disabled, submitting]);

  if (submitted) {
    const answerStr = order.map((idx, pos) => `${pos + 1}. ${options[idx]}`).join(' → ');
    return (
      <VoteConfirm
        submittedLabel="순위 제출 완료!"
        submittedDescription="나의 순위가 기록되었습니다"
        waitingLabel="결과를 기다리는 중..."
        waitingDescription="강사가 결과를 공개하면 표시됩니다"
        selectedAnswer={answerStr}
        selectedAnswerLabel="내 순서"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-sm space-y-4"
    >
      <p className="text-xs text-slate-400 text-center">
        드래그하여 올바른 순서로 배열하세요
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((idx, pos) => (
              <SortableRankItem
                key={`rank-${idx}`}
                id={`rank-${idx}`}
                label={options[idx]}
                position={pos + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={disabled || submitting}
        className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium text-base transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {submitting ? '제출 중...' : '이 순서로 제출'}
      </motion.button>
    </motion.div>
  );
})
