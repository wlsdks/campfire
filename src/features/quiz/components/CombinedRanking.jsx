import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Search } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

const SPRING = { type: 'spring', stiffness: 300, damping: 25 };

export default memo(function CombinedRanking({ session }) {
  const [search, setSearch] = useState('');

  const ranking = useMemo(() => {
    const questions = session?.questions || {};
    const scoreMap = {};

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
          scoreMap[pid] = { id: pid, nickname: vote.nickname || `참여자 ${pid.slice(0, 4)}`, correct: 0, answered: 0 };
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

  const filtered = search.trim()
    ? ranking.filter(e => e.nickname.toLowerCase().includes(search.trim().toLowerCase()))
    : ranking;

  const podiumColors = ['bg-amber-400', 'bg-slate-400', 'bg-amber-600'];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col" style={{ maxHeight: '80vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="text-center space-y-2 mb-4 shrink-0">
        <div className="flex items-center justify-center gap-2">
          <Medal size={24} className="text-amber-500" />
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">합산 랭킹</h3>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">총 {totalQuestions}개 문항 · 정답자 {ranking.length}명</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="학생 이름 검색..."
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Ranking list — scrollable */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          {search ? '검색 결과가 없습니다' : '아직 정답자가 없습니다'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {filtered.map((entry, i) => {
            const isPodium = entry.rank <= 3;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  isPodium ? `${podiumColors[entry.rank - 1]} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}>
                  {entry.rank}
                </span>
                <Avatar name={entry.nickname} size="sm" />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{entry.nickname}</span>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{entry.correct}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-0.5">/{totalQuestions}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 shrink-0">
        정답 수 기준 · 동점 시 참여 문항 적은 순
      </p>
    </div>
  );
});
