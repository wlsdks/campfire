import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { JUDGES } from '@/features/assignments/api/judges';

/**
 * 프레젠터 화면용 — AI 심사 진행 중 표시. 좌측 현재 학생 작품 + 우측 7판사 라이브 패널.
 */
export default function PresenterJudgingOverlay({ judgeState, judgeLog, submissions }) {
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
                <img src={currentSubmission.imageUrl} alt={`${currentName} 제출물`} className="w-full aspect-square object-cover" />
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

  // 상태는 보더 색상으로만 신호 — 배경 tint 제거 (§1)
  const stateColor = state === 'done' ? 'border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-800'
    : state === 'thinking' ? 'border-indigo-300 dark:border-indigo-500/40 bg-white dark:bg-slate-800'
    : state === 'error' ? 'border-red-300 dark:border-red-500/40 bg-white dark:bg-slate-800'
    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800';

  return (
    <motion.div
      layout
      className={`relative rounded-xl border p-3 transition-colors ${stateColor}`}
    >
      <div className="flex items-start gap-2.5">
        {/* 판사 아바타 — slate bg 통일, 상태는 ring + 텍스트 색상으로 표현 (§1) */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-slate-100 dark:bg-slate-700 ${
          state === 'thinking' ? 'text-slate-700 dark:text-slate-200 ring-2 ring-indigo-400/60 dark:ring-indigo-400/50 animate-pulse'
          : state === 'done' ? 'text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-400/60 dark:ring-emerald-400/50'
          : 'text-slate-500 dark:text-slate-400'
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
