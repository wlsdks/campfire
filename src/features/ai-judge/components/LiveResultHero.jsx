import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Medal, Award, Lock } from 'lucide-react';
import { getJudgeById } from '@/features/assignments/api/judges';

const RANK_META = [
  { key: 'first', title: '1등', color: 'from-amber-500 to-amber-600', Icon: Trophy },
  { key: 'second', title: '2등', color: 'from-slate-400 to-slate-500', Icon: Medal },
  { key: 'third', title: '3등', color: 'from-amber-400 to-amber-500', Icon: Award },
];

// 공개 순서 기준 — 실제 존재하는 랭크만 순회.
const ALL_ORDER = ['third', 'second', 'first'];

/**
 * LiveResultHero — 학생 쪽 결과.
 * 본인 결과는 항상 노출. TOP 공개는 강사가 단계별로 해금(revealedUpTo)하며 순차 드러남.
 */
export default memo(function LiveResultHero({ top3, myParticipantId, myResult, mySubmission, revealedUpTo = 0 }) {
  const myRank = Object.entries(top3 || {}).find(([, v]) => v.submissionId === myParticipantId)?.[0];
  const myRankMeta = myRank ? RANK_META.find(r => r.key === myRank) : null;
  const myAvg = myResult?.summary?.avgScore;
  // 실제 존재하는 랭크만 (제출 1~2명일 때 빈 슬롯 방지)
  const revealOrder = ALL_ORDER.filter((k) => top3?.[k]);
  const myRankVisible = myRank
    ? revealOrder.slice(0, revealedUpTo).includes(myRank)
    : false;

  return (
    <div className="space-y-4">
      {/* 본인 결과 카드 — 항상 공개 */}
      {mySubmission && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative overflow-hidden rounded-2xl border ${
            myRankMeta && myRankVisible ? 'border-amber-300 dark:border-amber-500/60 ring-2 ring-amber-200 dark:ring-amber-400/50' : 'border-slate-100 dark:border-slate-700'
          } bg-white dark:bg-slate-800`}
        >
          {/* 내 이미지 썸네일 — "내 거 잘 들어갔나?" 불안 해소 */}
          {mySubmission.imageUrl && (
            <img src={mySubmission.imageUrl} alt="" className="w-full max-h-48 object-cover" />
          )}

          {myRankMeta && myRankVisible && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
              className={`absolute top-2 right-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${myRankMeta.color} text-white text-sm font-bold shadow-lg flex items-center gap-1.5`}
            >
              <myRankMeta.Icon size={14} /> {myRankMeta.title}
            </motion.div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">내 결과</p>
            </div>
            {mySubmission.title && (
              <p className="text-slate-900 dark:text-slate-100 text-base font-semibold break-words">{mySubmission.title}</p>
            )}
            {typeof myAvg === 'number' && (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{myAvg.toFixed(1)}</span>
                <span className="text-sm text-slate-400">/ 10점</span>
              </div>
            )}
            {myResult?.judges && <JudgeComments judges={myResult.judges} />}
          </div>
        </motion.div>
      )}

      {/* TOP 3 — 강사가 단계별로 해금 */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {revealOrder.length === 1 ? '결과' : `TOP ${revealOrder.length}`}
          </p>
          <span className="ml-auto text-[11px] text-slate-400 tabular-nums">공개 {Math.min(revealedUpTo, revealOrder.length)}/{revealOrder.length}</span>
        </div>

        {revealedUpTo === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <Lock size={20} className="text-slate-300" />
            <p className="text-sm text-slate-400">강사님이 곧 순위를 공개합니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {revealOrder.slice(0, revealedUpTo).map((key, i) => {
                const meta = RANK_META.find(r => r.key === key);
                const w = top3?.[key];
                if (!w) return null;
                const isMe = w.submissionId === myParticipantId;
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i === revealedUpTo - 1 ? 0.05 : 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl ${
                      isMe ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                      <meta.Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-bold shrink-0 ${isMe ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                          {meta.title}
                        </span>
                        <span className={`text-sm font-semibold truncate min-w-0 ${isMe ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-200'}`}>
                          {w.name}
                        </span>
                        {isMe && (
                          <span className="text-[11px] bg-white/25 dark:bg-slate-900/20 text-white dark:text-slate-900 px-2 py-0.5 rounded-full font-bold shrink-0">
                            나
                          </span>
                        )}
                        <span className={`ml-auto text-sm tabular-nums font-semibold shrink-0 ${isMe ? 'text-white/90 dark:text-slate-900/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          {typeof w.score === 'number' ? w.score.toFixed(1) : '-'}
                        </span>
                      </div>
                      {w.highlight && (
                        <p className={`text-xs mt-1 leading-relaxed ${isMe ? 'text-white/80 dark:text-slate-900/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          "{w.highlight}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* 아직 안 나온 순위는 잠금 슬롯 */}
            {revealedUpTo < revealOrder.length && revealOrder.slice(revealedUpTo).map((key) => {
              const meta = RANK_META.find(r => r.key === key);
              return (
                <div key={`locked-${key}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Lock size={14} className="text-slate-300" />
                  </div>
                  <span className="text-sm text-slate-400">{meta.title} · 공개 대기</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

function JudgeComments({ judges }) {
  const entries = Object.values(judges || {}).filter(j => !j.error);
  if (!entries.length) return null;
  const top = entries.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const judge = getJudgeById(top.judgeId);
  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
        {judge?.name || top.judgeName} · {judge?.role}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">"{top.comment}"</p>
    </div>
  );
}
