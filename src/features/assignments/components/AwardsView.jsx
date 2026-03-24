import { useState, useEffect, useCallback } from 'react';
import { Trophy, X } from 'lucide-react';
import { getAwardById } from '@/features/assignments/api/judges';
import AwardsCeremony from './AwardsCeremony';
import Button from '@/components/ui/Button';

// ─── Awards Tab ────────────────────────────────────
export default function AwardsView({ assignmentId, awards, awardsLoading, hasResults }) {
  const [showCeremony, setShowCeremony] = useState(false);

  const closeCeremony = useCallback(() => setShowCeremony(false), []);

  useEffect(() => {
    if (!showCeremony) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCeremony();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCeremony, closeCeremony]);

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center py-16">
        <Trophy size={28} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 mt-4">심사 완료 후 시상 결과가 표시됩니다</p>
      </div>
    );
  }

  if (awardsLoading) {
    return <div className="py-16 text-center"><p className="text-sm text-slate-400">불러오는 중...</p></div>;
  }

  if (!awards || Object.keys(awards).length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <Trophy size={28} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 mt-4">시상 데이터가 없습니다</p>
      </div>
    );
  }

  if (showCeremony) {
    return (
      <div
        className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center overflow-auto"
        onClick={closeCeremony}
      >
        <button
          onClick={closeCeremony}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white transition-colors z-10"
          aria-label="닫기"
        >
          <X size={24} />
        </button>
        <AwardsCeremony assignmentId={assignmentId} />
      </div>
    );
  }

  const rankAwards = ['grand', 'excellence', 'outstanding'].filter(id => awards[id]);
  const specialAwards = ['planning', 'creative', 'design', 'practical'].filter(id => awards[id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">수상 결과</p>
        <Button onClick={() => setShowCeremony(true)} variant="primary" size="sm">
          <Trophy size={14} />
          시상식 시작
        </Button>
      </div>

      {rankAwards.length > 0 && (
        <div className="space-y-3">
          {rankAwards.map((awardId, i) => {
            const info = getAwardById(awardId);
            const winner = awards[awardId];
            const isGrand = i === 0;
            return (
              <div
                key={awardId}
                className={`rounded-2xl p-6 ${
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
                    <p className={`text-lg font-bold mt-1 ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                      {info?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold tabular-nums leading-none ${isGrand ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                      {winner.name}
                    </p>
                    <p className={`text-sm mt-1 tabular-nums ${isGrand ? 'text-white/50 dark:text-slate-400' : 'text-slate-400'}`}>
                      {winner.score}점
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {specialAwards.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {specialAwards.map(awardId => {
            const info = getAwardById(awardId);
            const winner = awards[awardId];
            return (
              <div
                key={awardId}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4"
              >
                <p className="text-[11px] text-slate-400">{info?.description}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{info?.name}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-3">{winner.name}</p>
                <p className="text-xs text-slate-400 tabular-nums mt-0.5">{winner.score}점</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
