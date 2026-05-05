/* eslint-disable react-refresh/only-export-components -- RANK_META는 TopThreeStage + RevealCard + FullResults에서 공유. 별도 파일 분리 가능하지만 같은 도메인 collocation 유지 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Eye, ChevronRight, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLiveJudging } from '../api/useLiveJudging';
import FullResults from './FullResults';

// §1 그라디언트 금지 — 단색 amber/slate, 명도 차로 금/은/동 위계 유지.
// 화이트 텍스트 대비 WCAG 확보를 위해 amber-400 이상 사용.
export const RANK_META = [
  { key: 'first', title: '1등', Icon: Trophy, bg: 'bg-amber-500', text: 'text-amber-500' },
  { key: 'second', title: '2등', Icon: Medal, bg: 'bg-slate-400', text: 'text-slate-400' },
  { key: 'third', title: '3등', Icon: Award, bg: 'bg-amber-400', text: 'text-amber-500' },
];

export default function TopThreeStage({ sessionId, questionId, top3, results, submissions, judgeState, isAdmin, isPresenter }) {
  const { setRevealedUpTo, reset } = useLiveJudging(sessionId, questionId);
  const revealedUpTo = judgeState?.revealedUpTo ?? 0;
  // 실제 존재하는 랭크만 순서에 포함 (제출 1~2명일 때 빈 슬롯 방지)
  const order = ['third', 'second', 'first'].filter((k) => top3?.[k]);
  const totalRanks = order.length;

  // 프레젠터 뷰: 드라마틱 공개 무대
  if (isPresenter) {
    const currentIdx = Math.min(revealedUpTo - 1, order.length - 1); // 실존 랭크 내로 제한
    const isStarted = currentIdx >= 0;
    const isComplete = currentIdx >= order.length - 1;

    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8 py-6" onClick={e => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <Trophy size={28} className="mx-auto text-slate-400" />
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI 심사 결과</h2>
          <p className="text-slate-400 text-sm">TOP 3 발표</p>
        </motion.div>

        <div className="min-h-[280px] w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isStarted ? (
              <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
                <p className="text-slate-400 text-lg">
                  {totalRanks === 1 ? '1등을 공개합니다' : totalRanks === 2 ? '2등부터 순서대로 공개합니다' : '3등부터 순서대로 공개합니다'}
                </p>
                <Button onClick={() => setRevealedUpTo(1)} size="lg">
                  <Eye size={18} /> {totalRanks === 1 ? '결과 공개' : `${['3', '2'][3 - totalRanks]}등부터 공개`}
                </Button>
              </motion.div>
            ) : (
              <motion.div key={`rank-${currentIdx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-4">
                <RevealCard rankKey={order[currentIdx]} winner={top3[order[currentIdx]]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isStarted && (
          <div className="flex items-center gap-3">
            {!isComplete ? (
              <Button onClick={() => setRevealedUpTo(revealedUpTo + 1)} size="lg">
                다음 공개 <ChevronRight size={18} />
              </Button>
            ) : (
              <Button onClick={() => setRevealedUpTo(0)} variant="ghost" size="md">
                <RotateCcw size={14} /> 처음부터
              </Button>
            )}
          </div>
        )}

        {/* 이미 공개된 순위 뱃지 */}
        {isStarted && (
          <div className="flex flex-wrap justify-center gap-2">
            {order.slice(0, currentIdx + 1).map((k) => {
              const w = top3?.[k];
              const meta = RANK_META.find(r => r.key === k);
              return (
                <span key={k} className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full px-3 py-1 text-xs">
                  <meta.Icon size={11} className={meta.text} />
                  <span className="text-slate-400">{meta.title}</span>
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">{w?.name}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 강사 Admin 뷰: 전체 현황 + 강사 전용 공개 컨트롤
  return (
    <FullResults
      top3={top3}
      results={results}
      submissions={submissions}
      revealedUpTo={revealedUpTo}
      onSetRevealedUpTo={isAdmin ? setRevealedUpTo : null}
      onReset={isAdmin ? reset : null}
    />
  );
}

const RevealCard = memo(function RevealCard({ rankKey, winner }) {
  const meta = RANK_META.find(r => r.key === rankKey);
  if (!winner) return null;
  const { Icon, title, bg } = meta;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full max-w-xl rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
    >
      <div className={`${bg} px-5 py-3 flex items-center gap-2 text-white`}>
        <Icon size={18} />
        <span className="text-lg font-bold">{title}</span>
        <span className="ml-auto text-2xl font-bold tabular-nums">
          {typeof winner.score === 'number' ? winner.score.toFixed(1) : '-'}
        </span>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">{winner.name}</p>
        {winner.highlight && (
          <p className="text-slate-500 dark:text-slate-400 text-base italic">"{winner.highlight}"</p>
        )}
        {winner.comment && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {winner.bestJudgeName} 심사평
            </p>
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{winner.comment}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});
