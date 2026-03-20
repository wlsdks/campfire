import { memo, useMemo } from 'react';
import { Sparkle, Flame, CheckCheck, Zap, Crown } from 'lucide-react';
import { computeAchievementStats } from '@/features/quiz/api/useAchievements';

const ICONS = { Sparkle, Flame, CheckCheck, Zap, Crown };

/**
 * AchievementSummary — shows aggregate achievement stats for instructor view.
 * Displays how many students earned each achievement type.
 *
 * @param {{ questions: Object, scores: Object, participantIds: string[] }} props
 */
export default memo(function AchievementSummary({ questions, scores, participantIds }) {
  const stats = useMemo(
    () => computeAchievementStats(questions, scores, participantIds),
    [questions, scores, participantIds]
  );

  if (stats.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">학생 업적</p>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
        {stats.map((a) => {
          const Icon = ICONS[a.icon] || Sparkle;
          return (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.label}</p>
                <p className="text-xs text-slate-400">{a.description}</p>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{a.count}명</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
