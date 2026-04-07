import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, Medal } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };
const INITIAL_SHOW = 10;

/**
 * CombinedRanking — 전체 문항 정답 합산 랭킹.
 * 세션의 모든 정답형 질문(mysteryBox, hintQuiz, fillinblank, quiz, ox)에서
 * 정답자 수를 합산하여 순위를 매긴다.
 */
export default memo(function CombinedRanking({ session }) {
  const [expanded, setExpanded] = useState(false);

  const ranking = useMemo(() => {
    const questions = session?.questions || {};
    const scoreMap = {}; // { participantId: { nickname, correct, totalTime } }

    Object.values(questions).forEach((q) => {
      const correctAnswer = q.correctAnswer;
      if (!correctAnswer) return;

      const acceptableAnswers = q.acceptableAnswers || [];
      const allCorrect = [correctAnswer, ...acceptableAnswers].map(a => a.trim().toLowerCase());
      const votes = q.votes || {};

      Object.entries(votes).forEach(([pid, vote]) => {
        const val = (vote.value || '').trim().toLowerCase();
        const isCorrect = allCorrect.includes(val);

        if (!scoreMap[pid]) {
          scoreMap[pid] = {
            id: pid,
            nickname: vote.nickname || `참여자 ${pid.slice(0, 4)}`,
            correct: 0,
            answered: 0,
          };
        }
        scoreMap[pid].answered++;
        if (isCorrect) scoreMap[pid].correct++;
      });
    });

    return Object.values(scoreMap)
      .filter(s => s.correct > 0)
      .sort((a, b) => b.correct - a.correct || a.answered - b.answered)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [session?.questions]);

  const totalQuestions = useMemo(() => {
    return Object.values(session?.questions || {}).filter(q => q.correctAnswer).length;
  }, [session?.questions]);

  const visible = expanded ? ranking : ranking.slice(0, INITIAL_SHOW);
  const remaining = ranking.length - INITIAL_SHOW;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <Medal size={24} className="text-amber-500" />
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            합산 랭킹
          </h3>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          총 {totalQuestions}개 문항 정답 합산
        </p>
      </motion.div>

      {ranking.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          아직 정답자가 없습니다
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <AnimatePresence initial={false}>
            {visible.map((entry, i) => {
              const isPodium = entry.rank <= 3;
              const podiumColors = ['bg-amber-400', 'bg-slate-400', 'bg-amber-600'];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''
                  }`}
                >
                  {/* Rank */}
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    isPodium
                      ? `${podiumColors[entry.rank - 1]} text-white`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {entry.rank}
                  </span>

                  {/* Avatar + Name */}
                  <Avatar name={entry.nickname} size="sm" />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {entry.nickname}
                  </span>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {entry.correct}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-0.5">
                      /{totalQuestions}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center justify-center gap-1 transition-colors border-t border-slate-100 dark:border-slate-700"
            >
              <ChevronDown size={14} />
              {remaining}명 더 보기
            </button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        정답 수 기준 · 동점 시 참여 문항 적은 순
      </p>
    </div>
  );
});
