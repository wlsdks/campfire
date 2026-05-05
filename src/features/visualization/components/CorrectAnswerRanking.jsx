import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search } from 'lucide-react';
import { useVotes } from '@/hooks/useVotes';
import Avatar from '@/components/ui/Avatar';

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };
const MAX_HEIGHT = '40vh';

export default memo(function CorrectAnswerRanking({ sessionId, questionId, correctAnswer, acceptableAnswers = [], myParticipantId = null }) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);
  const [search, setSearch] = useState('');

  const { ranking, myRank } = useMemo(() => {
    if (!correctAnswer) return { ranking: [], myRank: -1 };
    const allCorrect = [correctAnswer, ...acceptableAnswers].map(a => a.trim().toLowerCase());
    const correct = voteList
      .filter(v => allCorrect.includes((v.value || '').trim().toLowerCase()))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map((v, i) => ({ rank: i + 1, id: v.id, nickname: v.nickname || `참여자 ${(v.id || '').slice(0, 4)}` }));
    const myIdx = myParticipantId ? correct.findIndex(c => c.id === myParticipantId) : -1;
    return { ranking: correct, myRank: myIdx >= 0 ? myIdx + 1 : -1 };
  }, [voteList, correctAnswer, acceptableAnswers, myParticipantId]);

  if (ranking.length === 0) return null;

  const filtered = search.trim()
    ? ranking.filter(e => e.nickname.toLowerCase().includes(search.trim().toLowerCase()))
    : ranking;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.3 }} className="w-full max-w-md mx-auto mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-amber-500" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">정답자 {ranking.length}명</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">/ {totalVotes}명 참여</span>
      </div>

      {/* 학생 본인 순위 */}
      {myParticipantId && myRank > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center text-sm font-bold shrink-0">{myRank}</span>
          <span className="font-bold text-base">내 순위</span>
          <span className="text-sm text-white/60 dark:text-slate-500 ml-auto">{myRank}등 / {ranking.length}명</span>
        </div>
      )}
      {myParticipantId && myRank < 0 && totalVotes > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm text-center">아쉽지만 정답이 아니에요</div>
      )}

      {/* 검색 */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 검색..."
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
      </div>

      {/* 랭킹 리스트 — 내부 스크롤 */}
      <div className="overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" style={{ maxHeight: MAX_HEIGHT }}>
        {filtered.map((entry, i) => {
          const isMe = myParticipantId && entry.id === myParticipantId;
          const isPodium = entry.rank <= 3;
          return (
            <div key={entry.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''} ${isMe ? 'bg-slate-50 dark:bg-slate-700' : ''}`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 dark:bg-slate-700 ${
                isPodium ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              }`}>{entry.rank}</span>
              <Avatar name={entry.nickname} size="xs" />
              <span className={`flex-1 text-sm truncate ${isMe ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                {entry.nickname}{isMe && ' (나)'}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && search && (
          <div className="py-6 text-center text-xs text-slate-400">검색 결과 없음</div>
        )}
      </div>
    </motion.div>
  );
});
