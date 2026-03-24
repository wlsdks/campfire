import { memo } from 'react';
import { Check, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

/**
 * JudgeResultCard — 심사위원 1명의 평가 결과 카드.
 */
export default memo(function JudgeResultCard({ judge, result }) {
  if (!result) return null;

  const isError = result.error;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
      {/* Header: avatar + name + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={judge.name} size="sm" />
          <div>
            <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{judge.name}</p>
            <p className="text-xs text-slate-400">{judge.role} · {judge.focus}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.selected && !isError && (
            <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Check size={12} className="text-white dark:text-slate-900" />
            </span>
          )}
          <span className={`text-2xl font-bold tabular-nums tracking-tight ${
            isError ? 'text-slate-300' : 'text-slate-900 dark:text-slate-100'
          }`}>
            {isError ? '-' : result.score}
          </span>
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {result.comment}
      </p>

      {/* Strengths + Improvements */}
      {(result.strengths?.length > 0 || result.improvements?.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {result.strengths?.map((s, i) => (
            <span key={`s${i}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {s}
            </span>
          ))}
          {result.improvements?.map((s, i) => (
            <span key={`i${i}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-600 text-slate-400 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
