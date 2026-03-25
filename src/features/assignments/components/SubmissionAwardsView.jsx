import { Trophy } from 'lucide-react';
import { getAwardById } from '@/features/assignments/api/judges';

/** Student-facing awards results view (view === 'awardsView'). */
export default function SubmissionAwardsView({ awards }) {
  const rankAwards = ['grand', 'excellence', 'outstanding'].filter(id => awards[id]);
  const specialAwards = ['planning', 'creative', 'design', 'practical'].filter(id => awards[id]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy size={28} className="mx-auto text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-3">시상 결과</h2>
      </div>

      {/* Top 3 */}
      {rankAwards.map((awardId, i) => {
        const info = getAwardById(awardId);
        const winner = awards[awardId];
        const isGrand = i === 0;
        return (
          <div
            key={awardId}
            className={`rounded-2xl p-5 ${
              isGrand
                ? 'bg-slate-900 dark:bg-slate-100'
                : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isGrand ? 'text-white/40 dark:text-slate-500' : 'text-slate-400'}`}>
                  {info?.description}
                </p>
                <p className={`text-base font-bold mt-0.5 ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                  {info?.name}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold tracking-tight tabular-nums ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                  {winner.name}
                </p>
                <p className={`text-xs mt-0.5 tabular-nums ${isGrand ? 'text-white/50 dark:text-slate-400' : 'text-slate-400'}`}>
                  {winner.score}점
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Special awards */}
      {specialAwards.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {specialAwards.map(awardId => {
            const info = getAwardById(awardId);
            const winner = awards[awardId];
            return (
              <div key={awardId} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
                <p className="text-[11px] text-slate-400">{info?.description}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{info?.name}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">{winner.name}</p>
                <p className="text-xs text-slate-400 tabular-nums">{winner.score}점</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
