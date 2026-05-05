import { Trophy, Eye, ChevronRight, RotateCcw, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { RANK_META } from './TopThreeStage';

/**
 * 강사 Admin 뷰의 전체 결과 화면 — TOP3 카드 + 학생 공개 컨트롤 + 전체 점수 분포.
 * 프레젠터 뷰는 TopThreeStage가 직접 처리.
 */
export default function FullResults({ top3, results, submissions, revealedUpTo, onSetRevealedUpTo, onReset }) {
  const sorted = submissions
    .map((s) => {
      const r = results?.[s.id];
      return { ...s, avgScore: r?.summary?.avgScore, results: r?.judges };
    })
    .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));

  const order = ['first', 'second', 'third'].filter((k) => top3?.[k]);
  const isStarted = revealedUpTo > 0;
  const isComplete = revealedUpTo >= order.length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <Trophy size={24} className="mx-auto text-slate-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI 심사 결과</h2>
      </div>

      {/* 강사 전용 공개 컨트롤 — 학생들이 보는 결과와 동기화 */}
      {onSetRevealedUpTo && (
        <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">학생·프레젠터 공개 제어</p>
            <span className="ml-auto text-xs text-slate-400 tabular-nums">공개 {revealedUpTo}/3</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            학생 폰과 프레젠터 화면에는 여기서 공개한 순위까지만 보입니다. 3등부터 한 단계씩 공개하세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {!isStarted ? (
              <Button onClick={() => onSetRevealedUpTo(1)} variant="primary" size="md" disabled={order.length === 0}>
                <Eye size={15} /> {order.length === 1 ? '결과 공개' : `${3 - order.length + 1}등부터 공개`}
              </Button>
            ) : !isComplete ? (
              <Button onClick={() => onSetRevealedUpTo(revealedUpTo + 1)} variant="primary" size="md">
                다음 공개 <ChevronRight size={15} />
              </Button>
            ) : (
              <Button onClick={() => onSetRevealedUpTo(0)} variant="secondary" size="md">
                <RotateCcw size={13} /> 다시 숨기기
              </Button>
            )}
            {onReset && (
              <Button onClick={onReset} variant="ghost" size="md">재심사</Button>
            )}
          </div>
        </div>
      )}

      {/* TOP 3 카드 — 강사에겐 항상 전체 공개 (운영 편의) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {order.map((k) => {
          const w = top3?.[k];
          if (!w) return null;
          const meta = RANK_META.find(r => r.key === k);
          return (
            <div key={k} className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className={`${meta.bg} px-4 py-2 text-white flex items-center gap-1.5`}>
                <meta.Icon size={14} />
                <span className="text-sm font-bold">{meta.title}</span>
                <span className="ml-auto text-lg font-bold tabular-nums">
                  {typeof w.score === 'number' ? w.score.toFixed(1) : '-'}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words">{w.name}</p>
                {w.highlight && <p className="text-xs text-slate-500 italic">"{w.highlight}"</p>}
                {w.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">{w.bestJudgeName}:</span> {w.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 점수 분포 */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Users size={14} /> 전체 제출 ({submissions.length}명)
        </p>
        <div className="space-y-1.5">
          {sorted.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <span className="text-xs tabular-nums text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
              {s.imageUrl && <img src={s.imageUrl} alt={`${s.name} 제출물`} className="w-10 h-10 rounded object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.name}</p>
                {s.title && <p className="text-[11px] text-slate-400 truncate">{s.title}</p>}
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                {typeof s.avgScore === 'number' ? s.avgScore.toFixed(1) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
