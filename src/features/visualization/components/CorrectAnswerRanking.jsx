import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';
import Avatar from '@/components/ui/Avatar';

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };

/**
 * CorrectAnswerRanking — 정답자 목록 (제출 순서 = 랭킹).
 * 미스터리 박스/힌트 퀴즈 정답 공개 후 표시.
 *
 * @param {string} sessionId
 * @param {string} questionId
 * @param {string} correctAnswer
 * @param {string[]} acceptableAnswers — 힌트 퀴즈용 추가 허용 답변
 * @param {string|null} myParticipantId — 학생 본인 ID (학생 뷰에서만)
 */
export default memo(function CorrectAnswerRanking({
  sessionId,
  questionId,
  correctAnswer,
  acceptableAnswers = [],
  myParticipantId = null,
}) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);
  const [expanded, setExpanded] = useState(false);

  const { ranking, myRank } = useMemo(() => {
    if (!correctAnswer) return { ranking: [], myRank: -1 };
    const allCorrect = [correctAnswer, ...acceptableAnswers].map(a => a.trim().toLowerCase());

    // 정답자를 제출 시간순으로 정렬 (빠른 순)
    const correct = voteList
      .filter(v => allCorrect.includes((v.value || '').trim().toLowerCase()))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map((v, i) => ({
        rank: i + 1,
        id: v.id,
        nickname: v.nickname || `참여자 ${(v.id || '').slice(0, 4)}`,
      }));

    const myIdx = myParticipantId ? correct.findIndex(c => c.id === myParticipantId) : -1;
    return { ranking: correct, myRank: myIdx >= 0 ? myIdx + 1 : -1 };
  }, [voteList, correctAnswer, acceptableAnswers, myParticipantId]);

  if (ranking.length === 0) return null;

  const INITIAL_SHOW = 10;
  const visible = expanded ? ranking : ranking.slice(0, INITIAL_SHOW);
  const remaining = ranking.length - INITIAL_SHOW;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.3 }}
      className="w-full max-w-md mx-auto mt-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-amber-500" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          정답자 {ranking.length}명
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">/ {totalVotes}명 참여</span>
      </div>

      {/* 학생 본인 순위 (학생 뷰에서만) */}
      {myParticipantId && myRank > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3 p-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center gap-3"
        >
          <span className="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {myRank}
          </span>
          <span className="font-bold text-base">내 순위</span>
          <span className="text-sm text-white/60 dark:text-slate-500 ml-auto">{myRank}등 / {ranking.length}명</span>
        </motion.div>
      )}
      {myParticipantId && myRank < 0 && totalVotes > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm text-center">
          아쉽지만 정답이 아니에요
        </div>
      )}

      {/* 랭킹 리스트 */}
      <div className="space-y-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <AnimatePresence initial={false}>
          {visible.map((entry, i) => {
            const isMe = myParticipantId && entry.id === myParticipantId;
            const isPodium = entry.rank <= 3;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  isMe ? 'bg-slate-50 dark:bg-slate-700' : ''
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isPodium
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}>
                  {entry.rank}
                </span>
                <Avatar name={entry.nickname} size="xs" />
                <span className={`flex-1 text-sm truncate ${
                  isMe ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {entry.nickname}{isMe && ' (나)'}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!expanded && remaining > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center justify-center gap-1 transition-colors border-t border-slate-100 dark:border-slate-700"
          >
            <ChevronDown size={14} />
            {remaining}명 더 보기
          </button>
        )}
      </div>
    </motion.div>
  );
});
