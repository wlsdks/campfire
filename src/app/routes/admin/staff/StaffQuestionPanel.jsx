import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Check } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

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

export default function StaffQuestionPanel({ urgentList, classList, selectedId, onSelect }) {
  const unified = useMemo(() => {
    const urgent = urgentList.map((q) => ({ ...q, _type: 'urgent' }));
    const classQ = classList.map((q) => ({ ...q, _type: 'class' }));
    return [...urgent, ...classQ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [urgentList, classList]);

  const totalCount = unified.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">질문</h2>
          {totalCount > 0 && (
            <span className="text-xs text-slate-400 tabular-nums">{totalCount}</span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {totalCount === 0 ? (
          <div className="flex items-center justify-center py-16 px-5">
            <EmptyState
              title="질문이 없습니다"
              description="학생들의 질문이 여기에 표시됩니다"
              mascotSize="sm"
            />
          </div>
        ) : (
          <div className="p-3 space-y-1">
            <AnimatePresence>
              {unified.map((q) => {
                const key = `${q._type}-${q.id}`;
                const isUrgent = q._type === 'urgent';
                const isDimmed = isUrgent ? q.read : q.answered;
                const isSelected = selectedId === key;

                return (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelect({ ...q, _key: key })}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-700 ring-1 ring-slate-300 dark:ring-slate-500'
                        : isDimmed
                          ? 'opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!isDimmed && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-100 mt-1.5 shrink-0" />
                      )}
                      {isDimmed && (
                        <Check size={12} className="text-slate-400 mt-1 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-2">
                          {q.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              isUrgent
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isUrgent ? '긴급' : '수업'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 text-[10px]">
                            {timeAgo(q.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
