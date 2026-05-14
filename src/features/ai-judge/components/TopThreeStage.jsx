/* eslint-disable react-refresh/only-export-components -- RANK_META는 TopThreeStage + RevealCard + FullResults에서 공유. 별도 파일 분리 가능하지만 같은 도메인 collocation 유지 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
    return <PresenterStage order={order} totalRanks={totalRanks} top3={top3} revealedUpTo={revealedUpTo} setRevealedUpTo={setRevealedUpTo} />;
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

/**
 * PresenterStage — 전자칠판용 드라마틱 무대.
 * 1등 reveal 직전 "2 → 1" 짧은 카운트다운 후 RevealCard 등장 + confetti.
 */
function PresenterStage({ order, totalRanks, top3, revealedUpTo, setRevealedUpTo }) {
  const currentIdx = Math.min(revealedUpTo - 1, order.length - 1);
  const isStarted = currentIdx >= 0;
  const isComplete = currentIdx >= order.length - 1;
  const isFirstPlace = isStarted && order[currentIdx] === 'first';

  // 카운트다운 — 클릭 핸들러에서 즉시 시작(2 → 1 → null + reveal). useEffect 기반보다
  // race condition·StrictMode 이중 호출 영향 없이 확실함.
  const [countdown, setCountdown] = useState(null);
  const showCountdown = countdown !== null;
  const showRevealCard = isStarted && !showCountdown;

  // reveal 진행 — 다음 등수가 1등이고 totalRanks ≥ 2면 카운트다운 후 reveal, 아니면 즉시.
  // 카운트다운 각 1초씩 (총 2초) — 학생들이 "다음 큰 거 온다" 긴장감 충분히 체감.
  const advanceTo = useCallback((nextRevealed) => {
    const nextRankKey = order[Math.min(nextRevealed - 1, order.length - 1)];
    if (nextRankKey === 'first' && order.length >= 2) {
      setCountdown(2);
      const t1 = setTimeout(() => setCountdown(1), 1000);
      const t2 = setTimeout(() => {
        setCountdown(null);
        setRevealedUpTo(nextRevealed);
      }, 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    setRevealedUpTo(nextRevealed);
  }, [order, setRevealedUpTo]);

  return (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center gap-8 py-6" onClick={e => e.stopPropagation()}>
      {/* 1등 공개 시 confetti — 카운트다운 끝나고 RevealCard 등장과 함께 */}
      <Confetti active={isFirstPlace && !showCountdown} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <Trophy size={28} className="mx-auto text-slate-400" />
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI 심사 결과</h2>
        <p className="text-slate-400 text-sm">TOP 3 발표</p>
      </motion.div>

      <div className="relative min-h-[320px] w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
              <p className="text-slate-400 text-lg">
                {totalRanks === 1 ? '1등을 공개합니다' : totalRanks === 2 ? '2등부터 순서대로 공개합니다' : '3등부터 순서대로 공개합니다'}
              </p>
              <Button onClick={() => advanceTo(1)} size="lg">
                <Eye size={18} /> {totalRanks === 1 ? '결과 공개' : `${['3', '2'][3 - totalRanks]}등부터 공개`}
              </Button>
            </motion.div>
          ) : (
            <motion.div key={`rank-${currentIdx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-4">
              <RevealCard rankKey={order[currentIdx]} winner={top3[order[currentIdx]]} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 카운트다운 — absolute overlay로 즉시 표시. 이전 RevealCard exit 대기 X */}
        <AnimatePresence>
          {showCountdown && <CountdownOverlay n={countdown} />}
        </AnimatePresence>
      </div>

      {showRevealCard && (
        <div className="flex items-center gap-3">
          {!isComplete ? (
            <Button onClick={() => advanceTo(revealedUpTo + 1)} size="lg">
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
      {showRevealCard && (
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

/**
 * CountdownOverlay — 1등 reveal 직전 짧은 카운트다운.
 * 2 → 1 → 사라짐 (총 1.4초). 큰 숫자가 spring으로 등장.
 */
const CountdownOverlay = memo(function CountdownOverlay({ n }) {
  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm rounded-3xl"
    >
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 uppercase tracking-wider font-semibold">대상 발표</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={n}
          initial={{ scale: 0.5, opacity: 0 }}
          // 등장 후 800ms마다 살짝 펄스 — 두근거리는 긴장감.
          animate={{ scale: [1, 1.06, 1], opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{
            scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
          }}
          className="text-[10rem] md:text-[14rem] leading-none font-black text-amber-500 tabular-nums"
        >
          {n}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * Confetti — 1등 공개 시 amber 파티클 흩날림. design system에 맞춰 amber/slate만.
 * pointer-events-none + absolute 깔아 인터랙션 방해 없음. ~2.5초 후 알아서 사라짐.
 */
const CONFETTI_COLORS = ['#f59e0b', '#fbbf24', '#facc15', '#fde68a', '#475569'];
const Confetti = memo(function Confetti({ active }) {
  if (!active) return null;
  const count = 60;
  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 8;
        const drift = (Math.random() - 0.5) * 300;
        const rotate = 360 + Math.random() * 720;
        const dur = 2 + Math.random() * 1.5;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{ left: `${left}%`, top: '40%', width: size, height: size * 1.4, backgroundColor: color }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: 700 + Math.random() * 200, x: drift, rotate, opacity: 0 }}
            transition={{ duration: dur, ease: [0.2, 0.6, 0.4, 1] }}
          />
        );
      })}
    </div>
  );
});

/** 점수 slot machine — 짧게 굴러서 멈추는 카지노 풍 효과. */
function useSlotScore(target, durationMs = 1100) {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number') return;
    if (targetRef.current === target) return;
    targetRef.current = target;

    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / durationMs);
      // ease-out cubic + 마지막 25%는 흔들림 없이 정밀하게
      if (p < 0.75) {
        // 굴리는 단계 — 0~target+overshoot 사이 빠르게 튐
        const wobble = (Math.random() - 0.5) * 2 * (1 - p);
        setDisplay(Math.max(0, target + wobble));
      } else {
        const finalP = (p - 0.75) / 0.25;
        const eased = 1 - Math.pow(1 - finalP, 3);
        setDisplay(target * (0.85 + 0.15 * eased));
        if (p >= 1) setDisplay(target);
      }
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}

const RevealCard = memo(function RevealCard({ rankKey, winner }) {
  const meta = RANK_META.find(r => r.key === rankKey);
  const animatedScore = useSlotScore(typeof winner?.score === 'number' ? winner.score : 0);
  if (!winner) return null;
  const { Icon, title, bg, key } = meta;
  const isFirst = key === 'first';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: isFirst ? 0.7 : 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        // 1등은 더 격렬한 overshoot — stiffness 240 + damping 14 → 약 1.06까지 튀어오른 후 안정
        stiffness: isFirst ? 240 : 300,
        damping: isFirst ? 14 : 25,
        mass: isFirst ? 1 : 0.8,
      }}
      className={`relative w-full ${isFirst ? 'max-w-2xl' : 'max-w-xl'} rounded-3xl border ${isFirst ? 'border-amber-200 dark:border-amber-500/40 ring-4 ring-amber-200/60 dark:ring-amber-500/30 shadow-2xl shadow-amber-500/10' : 'border-slate-100 dark:border-slate-700'} bg-white dark:bg-slate-800 overflow-hidden`}
    >
      <div className={`${bg} px-5 py-3 flex items-center gap-2 text-white relative`}>
        <Icon size={18} />
        <span className="text-lg font-bold">{title}</span>
        {/* 평균 9점 이상은 7판사 만장일치급 — "AI 극찬" 라벨. 라이브 수업에서 극히 드물어 임팩트. */}
        {typeof winner.score === 'number' && winner.score >= 9 && (
          <motion.span
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.4 }}
            className="ml-1 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase tracking-wider"
          >
            AI 극찬
          </motion.span>
        )}
        <span className="ml-auto text-2xl font-bold tabular-nums">
          {animatedScore.toFixed(1)}
        </span>
      </div>
      <div className={`${isFirst ? 'p-6' : 'p-5'} space-y-2`}>
        <p className={`${isFirst ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'} font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words`}>
          {winner.name}
        </p>
        {winner.highlight && (
          <p className={`${isFirst ? 'text-lg' : 'text-base'} text-slate-500 dark:text-slate-400 italic`}>
            "{winner.highlight}"
          </p>
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
