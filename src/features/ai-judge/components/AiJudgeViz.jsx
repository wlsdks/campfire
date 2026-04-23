import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Users, Medal, Award, Eye, ChevronRight, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLiveSubmissions, useLiveJudgeResults, useLiveJudging } from '../api/useLiveJudging';
import { JUDGES } from '@/features/assignments/api/judges';
import AiJudgePanel from './AiJudgePanel';

// 금/은/동은 기능적 랭킹 표시 — 단일 색조(amber)에 명도만 달리해서 화면당 2-3색 원칙 유지.
// 기능적 랭킹 색상 — 금/은/동. 화이트 텍스트 대비 WCAG 확보를 위해 최소 amber-400 이상.
const RANK_META = [
  { key: 'first', title: '1등', Icon: Trophy, grad: 'from-amber-500 to-amber-600', text: 'text-amber-500' },
  { key: 'second', title: '2등', Icon: Medal, grad: 'from-slate-400 to-slate-500', text: 'text-slate-400' },
  { key: 'third', title: '3등', Icon: Award, grad: 'from-amber-400 to-amber-500', text: 'text-amber-500' },
];

export default memo(function AiJudgeViz({ sessionId, questionId, isAdmin, isPresenter = false }) {
  const { submissions } = useLiveSubmissions(sessionId, questionId);
  const { top3, judgeState, results, judgeLog } = useLiveJudgeResults(sessionId, questionId);

  const isDone = judgeState?.status === 'done' && top3;
  const isJudging = judgeState?.status === 'judging';

  if (isDone) {
    return (
      <TopThreeStage
        sessionId={sessionId}
        questionId={questionId}
        top3={top3}
        results={results}
        submissions={submissions}
        judgeState={judgeState}
        isAdmin={isAdmin}
        isPresenter={isPresenter}
      />
    );
  }

  // 프레젠터 + 심사 진행 중: 큰 화면용 피드백 오버레이 (판사별 라이브 thinking)
  if (isPresenter && isJudging) {
    return <PresenterJudgingOverlay judgeState={judgeState} judgeLog={judgeLog} submissions={submissions} />;
  }

  // 헤더도 SubmissionGrid와 같은 폭으로 맞춰 좌우 간격 과다 방지
  const headerCfg = isPresenter && submissions.length > 0 ? getPresenterGridConfig(submissions.length) : null;
  const headerInnerMax = headerCfg?.maxW || '';
  return (
    // isPresenter: 외부 공간이 넓어도 헤더는 그리드 폭과 맞춰 좌우 간격 과다 방지.
    <div className={`w-full ${isPresenter ? 'max-w-[92rem] space-y-3' : 'max-w-3xl space-y-5'} mx-auto px-2`}>
      <div className={`${headerInnerMax} mx-auto flex items-center justify-between px-1`}>
        <h3 className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 ${isPresenter ? 'text-base' : 'text-lg'}`}>
          <Sparkles size={isPresenter ? 15 : 18} className="text-slate-400" />
          실시간 제출
        </h3>
        <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <Users size={13} /> {submissions.length}건
        </span>
      </div>

      {/* API 키 입력/심사 시작 패널은 어드민 대시보드에서만. 프레젠터 화면엔 절대 노출 금지 */}
      {isAdmin && !isPresenter && <AiJudgePanel sessionId={sessionId} questionId={questionId} />}

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className={`text-slate-400 ${isPresenter ? 'text-2xl' : 'text-sm'}`}>학생들의 제출을 기다리는 중...</p>
        </div>
      ) : (
        <SubmissionGrid submissions={submissions} isPresenter={isPresenter} />
      )}
    </div>
  );
});

function PresenterJudgingOverlay({ judgeState, judgeLog, submissions }) {
  const current = judgeState?.current ?? 0;
  const total = judgeState?.total ?? 0;
  const currentName = judgeLog?.currentName || judgeState?.currentName || '';
  const pct = total ? (current / total) * 100 : 0;

  const currentSubmission = submissions?.find((s) => s.name === currentName);
  const judgeLogs = judgeLog?.judges || {};

  return (
    <div className="w-full max-w-[92rem] mx-auto flex flex-col gap-6 px-4 py-6" role="status" aria-live="polite">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center shrink-0"
          >
            <Sparkles size={22} className="text-white dark:text-slate-900" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI 심사 진행 중</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm tabular-nums">
              {total > 0 ? `${current} / ${total}명 심사 중` : '준비 중...'}
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="w-64 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* 본문 — 좌:현재작품 / 우:판사 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,28rem)_1fr] gap-6 items-start">
        {/* 현재 심사 중인 학생 작품 카드 */}
        <AnimatePresence mode="wait">
          {currentName && (
            <motion.div
              key={currentName}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              {currentSubmission?.imageUrl ? (
                <img src={currentSubmission.imageUrl} alt="" className="w-full aspect-square object-cover" />
              ) : currentSubmission?.code ? (
                <div className="w-full aspect-square bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="text-4xl font-mono">{'</>'}</span>
                  <span className="text-sm uppercase tracking-wider">HTML 코드</span>
                </div>
              ) : (
                <div className="w-full aspect-square bg-slate-50 dark:bg-slate-700" />
              )}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {currentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{currentName}</p>
                  {currentSubmission?.title && (
                    <p className="text-sm text-slate-400 truncate">{currentSubmission.title}</p>
                  )}
                </div>
                <span className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold tabular-nums shrink-0">심사 중</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7명 심사위원 라이브 패널 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI 심사위원 7명</p>
            <span className="text-[11px] text-slate-400">동시에 평가 중</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {JUDGES.map((judge) => {
              const log = judgeLogs[judge.id];
              return <JudgeLiveCard key={judge.id} judge={judge} log={log} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const JudgeLiveCard = memo(function JudgeLiveCard({ judge, log }) {
  const state = log?.state || 'waiting'; // waiting | thinking | done | error
  const hint = log?.hint;
  const score = log?.score;

  const stateColor = state === 'done' ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5'
    : state === 'thinking' ? 'border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-800'
    : state === 'error' ? 'border-red-200 dark:border-red-500/30 bg-red-50/40 dark:bg-red-500/5'
    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800';

  return (
    <motion.div
      layout
      className={`relative rounded-xl border p-3 transition-colors ${stateColor}`}
    >
      <div className="flex items-start gap-2.5">
        {/* 판사 아바타 — thinking은 slate + pulse, done은 emerald(완료 시각언어 유지) */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          state === 'thinking' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 ring-2 ring-indigo-400/60 dark:ring-indigo-400/50 animate-pulse'
          : state === 'done' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }`}>
          {judge.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{judge.name}</p>
            <span className="text-[10px] text-slate-400 truncate">· {judge.role}</span>
          </div>
          {/* 상태별 표시 */}
          <AnimatePresence mode="wait">
            {state === 'waiting' && (
              <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-slate-400 mt-1">대기 중…</motion.p>
            )}
            {state === 'thinking' && (
              <motion.div
                key={`think-${hint}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-1.5 mt-1"
              >
                <Loader2 size={11} className="text-indigo-500 animate-spin shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{hint || '고민 중…'}</p>
              </motion.div>
            )}
            {state === 'done' && (
              <motion.div
                key={`done-${score}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-1.5 mt-1"
              >
                <CheckCircle2 size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed truncate">{hint}</p>
                  {typeof score === 'number' && (
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                      {score}<span className="text-[10px] text-slate-400 font-normal"> / 10</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
            {state === 'error' && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1">
                <p className="text-[11px] text-red-500 font-medium">평가 실패</p>
                {hint && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate" title={hint}>{hint}</p>}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  (API 한도 또는 네트워크 문제일 수 있어요. 다시 심사를 시도해보세요)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * 제출 수별 프레젠터 그리드 구성 — 뒷자리 가독성 vs 전체 조망 균형.
 * 소규모(1~3): 큰 카드로 주목. 중규모(4~12): 3~4열. 대규모(13+): 5~6열로 전체 조망.
 */
// 구간별 카드 종횡비/최대폭 — 뷰포트 초과하면 grid wrapper가 overflow-y-auto로 스크롤 허용.
// 1080p 기준 나머지 공간 ~820px. 카드 크기는 "너무 크지 않게" 중간 톤.
function getPresenterGridConfig(count) {
  if (count <= 1) return { cols: 'grid-cols-1', gap: 'gap-6', maxW: 'max-w-sm', pad: 'p-4', name: 'text-xl', title: 'text-sm', aspect: 'aspect-[4/3]' };
  if (count <= 2) return { cols: 'grid-cols-2', gap: 'gap-4', maxW: 'max-w-2xl', pad: 'p-3', name: 'text-lg', title: 'text-xs', aspect: 'aspect-[4/3]' };
  if (count <= 6) return { cols: 'grid-cols-3', gap: 'gap-3', maxW: 'max-w-3xl', pad: 'p-2.5', name: 'text-sm', title: 'text-xs', aspect: 'aspect-[3/2]' };
  if (count <= 12) return { cols: 'grid-cols-4', gap: 'gap-3', maxW: 'max-w-5xl', pad: 'p-2', name: 'text-sm', title: 'text-[11px]', aspect: 'aspect-[3/2]' };
  if (count <= 30) return { cols: 'grid-cols-5', gap: 'gap-2.5', maxW: 'max-w-6xl', pad: 'p-2', name: 'text-xs', title: 'text-[11px]', aspect: 'aspect-[16/9]' };
  return { cols: 'grid-cols-6', gap: 'gap-2', maxW: 'max-w-[88rem]', pad: 'p-1.5', name: 'text-[11px]', title: 'text-[10px]', aspect: 'aspect-[16/9]' };
}

const SubmissionGrid = memo(function SubmissionGrid({ submissions, isPresenter }) {
  const count = submissions.length;
  const presenterCfg = isPresenter ? getPresenterGridConfig(count) : null;

  const gridCls = isPresenter
    ? `grid ${presenterCfg.cols} ${presenterCfg.gap} ${presenterCfg.maxW} mx-auto`
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';

  return (
    <div className={gridCls}>
      <AnimatePresence>
        {submissions.map((s) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {(() => {
              // 프레젠터는 count에 따라 aspect 동적, 관리자 그리드(isPresenter=false)는 square 유지
              const asp = isPresenter ? presenterCfg.aspect : 'aspect-square';
              if (s.imageUrl) return <img src={s.imageUrl} alt="" className={`w-full ${asp} object-cover`} />;
              if (s.code) return (
                <div className={`w-full ${asp} bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-1`}>
                  <span className="text-2xl font-mono">{'</>'}</span>
                  <span className="text-[10px] uppercase tracking-wider">HTML 코드</span>
                </div>
              );
              return (
                <div className={`w-full ${asp} bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300 text-xs`}>
                  제출물 없음
                </div>
              );
            })()}
            <div className={isPresenter ? presenterCfg.pad : 'p-2'}>
              <p className={`font-semibold text-slate-700 dark:text-slate-200 truncate ${isPresenter ? presenterCfg.name : 'text-xs'}`}>{s.name}</p>
              {s.title && <p className={`text-slate-400 truncate ${isPresenter ? presenterCfg.title : 'text-[11px]'}`}>{s.title}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

function TopThreeStage({ sessionId, questionId, top3, results, submissions, judgeState, isAdmin, isPresenter }) {
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
  const { Icon, title, grad } = meta;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full max-w-xl rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${grad} px-5 py-3 flex items-center gap-2 text-white`}>
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

function FullResults({ top3, results, submissions, revealedUpTo, onSetRevealedUpTo, onReset }) {
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
              <div className={`bg-gradient-to-r ${meta.grad} px-4 py-2 text-white flex items-center gap-1.5`}>
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
              {s.imageUrl && <img src={s.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
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
