import { useState, useMemo, useEffect, memo } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Users, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { useVotes } from '@/hooks/useVotes';
import { gradeSubjective, isGradingReady } from '@/features/questions/api/gradeSubjective';
import PickMascot from '@/components/ui/PickMascot';
import Avatar from '@/components/ui/Avatar';

// 하우스 스타일(AnswerRevealCard 준거): 긍정=emerald, 나머지=slate 모노크로매틱. 신호등 색상 미사용.
function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
  return 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700';
}

function DetailModal({ item, grade, onClose }) {
  if (!item) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={item.nickname || '익명'} size="sm" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.nickname || '익명'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <p className="text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">{item.value}</p>
        {grade && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${scoreColor(grade.score)}`}>{grade.score}점</span>
            </div>
            {grade.feedback && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{grade.feedback}</p>}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const WALL_LIMIT = 18; // 스크롤 없이 화면에 채우는 최신 답변 수(3열×6행). 초과분은 밀려남 → 더보기로 열람.

export default memo(function SubjectiveResults({ sessionId, questionId, question, isAdmin }) {
  const { voteList } = useVotes(sessionId, questionId);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = question?.title;
  const modelAnswer = question?.modelAnswer || '';

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const gradesRef = ref(db, `sessions/${sessionId}/questions/${questionId}/aiGrades`);
    const unsub = onValue(gradesRef, (snap) => setGrades(snap.val() || {}));
    return () => unsub();
  }, [sessionId, questionId]);

  const sorted = useMemo(
    () => [...voteList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [voteList]
  );

  const gradedCount = Object.keys(grades).length;
  const canGrade = isAdmin && isGradingReady() && modelAnswer && sorted.length > 0 && !loading;

  async function handleGrade() {
    if (!canGrade) return;
    setLoading(true);
    setError('');
    try {
      const responses = voteList.map((v) => ({ id: v.id, value: v.value })).filter((r) => r.value);
      const results = await gradeSubjective({ questionTitle: title, modelAnswer, responses });
      await Promise.all(
        results.map((g) =>
          set(ref(db, `sessions/${sessionId}/questions/${questionId}/aiGrades/${g.id}`), {
            score: g.score,
            feedback: g.feedback,
            gradedAt: serverTimestamp(),
          })
        )
      );
    } catch (err) {
      logger.error('Grade failed:', err);
      setError(err.message || 'AI 채점에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1">{title}</h2>}
            <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><Users size={14} />{sorted.length}명 응답</span>
              {gradedCount > 0 && <span>· {gradedCount}명 채점됨</span>}
            </div>
          </div>
          {isAdmin && isGradingReady() && (
            <button
              onClick={handleGrade}
              disabled={!canGrade}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                canGrade
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? '채점 중' : gradedCount > 0 ? '다시 채점' : 'AI 채점'}
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        {/* 응답 벽 — flex-wrap + 고정 크기 카드 + layout. 새 답변이 index 0로 들어오면
            나머지 카드가 layout 애니로 부드럽게 밀려남(드르르륵). CSS grid는 layout 애니가
            janky해서 flex-wrap 사용. 기본은 스크롤 없이 최신 WALL_LIMIT개, 더보기로 전체 열람.
            기본 모드는 ~18개만 렌더 → 약한 노트북 DOM 부담 없음. */}
        <div className={`flex flex-wrap gap-3 content-start ${expanded ? 'max-h-[64vh] overflow-y-auto scrollbar-hide pr-1' : ''}`}>
          <AnimatePresence initial={false}>
            {(expanded ? sorted : sorted.slice(0, WALL_LIMIT)).map((vote) => {
              const grade = grades[vote.id];
              return (
                <motion.button
                  key={vote.id}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                  // layout: 부드러운 슬라이드(밀림) / scale: 통통 팝 / opacity: 페이드
                  transition={{
                    layout: { type: 'spring', stiffness: 340, damping: 30 },
                    scale: { type: 'spring', stiffness: 460, damping: 20 },
                    opacity: { duration: 0.2 },
                  }}
                  onClick={() => setSelected(vote)}
                  className="w-full sm:w-[calc(50%-0.375rem)] xl:w-[calc(33.333%-0.5rem)] h-[104px] overflow-hidden text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar name={vote.nickname || '익명'} size="sm" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{vote.nickname || '익명'}</span>
                    {grade && <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ml-auto shrink-0 ${scoreColor(grade.score)}`}>{grade.score}점</span>}
                  </div>
                  <p className="text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed break-words line-clamp-2">{vote.value}</p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 더보기 / 접기 — WALL_LIMIT 초과 시에만 */}
        {sorted.length > WALL_LIMIT && (
          <div className="mt-5 text-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150"
            >
              {expanded ? '접기' : `전체 ${sorted.length}개 응답 더보기`}
            </button>
          </div>
        )}

        {sorted.length === 0 && (
          <div className="text-center py-20 space-y-3 flex flex-col items-center">
            <PickMascot size="sm" />
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-sm">아직 답변이 없습니다</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">학생들이 답변하면 여기에 표시됩니다</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <DetailModal item={selected} grade={grades[selected.id]} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
});
