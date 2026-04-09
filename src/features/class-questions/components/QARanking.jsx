import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageSquare, Crown } from 'lucide-react';
import { useQAStats } from '@/features/class-questions/api/useQAStats';
import EmptyState from '@/components/ui/EmptyState';

const MEDAL = ['🥇', '🥈', '🥉'];

function RankRow({ entry, rank, field }) {
  const value = field === 'questions' ? entry.questions : field === 'answers' ? entry.answers : entry.total;
  const isPodium = rank < 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: rank * 0.04 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 ${
        isPodium
          ? 'bg-white dark:bg-slate-800 shadow-sm'
          : 'bg-slate-50/50 dark:bg-slate-800/50'
      }`}
    >
      <span className="w-8 text-center shrink-0">
        {isPodium ? (
          <span className="text-lg">{MEDAL[rank]}</span>
        ) : (
          <span className="text-sm font-bold text-slate-400 tabular-nums">{rank + 1}</span>
        )}
      </span>
      <span className={`flex-1 truncate ${isPodium ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'} text-sm`}>
        {entry.nickname}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`tabular-nums font-bold ${isPodium ? 'text-lg text-slate-900 dark:text-slate-100' : 'text-sm text-slate-600 dark:text-slate-300'}`}>
          {value}
        </span>
        <span className="text-[10px] text-slate-400">
          {field === 'questions' ? '질문' : field === 'answers' ? '답변' : '활동'}
        </span>
      </div>
    </motion.div>
  );
}

export default function QARanking({ sessionId }) {
  const { totalRanking, questionRanking, answerRanking, totalQuestions, totalAnswers, loading } = useQAStats(sessionId);
  const [tab, setTab] = useState('total');

  const tabs = [
    { key: 'total', label: '종합', icon: Crown },
    { key: 'questions', label: '질문왕', icon: HelpCircle },
    { key: 'answers', label: '답변왕', icon: MessageSquare },
  ];

  const ranking = tab === 'questions' ? questionRanking : tab === 'answers' ? answerRanking : totalRanking;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (totalRanking.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <EmptyState
          title="Q&A 활동이 없습니다"
          description="학생들이 질문하거나 답변하면 랭킹이 표시됩니다"
          mascotSize="md"
          mood="waiting"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Q&A 랭킹
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
          질문 {totalQuestions}개 · 답변 {totalAnswers}개
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Ranking list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-1.5"
        >
          {ranking.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              {tab === 'questions' ? '아직 질문한 학생이 없습니다' : '아직 답변한 학생이 없습니다'}
            </p>
          ) : (
            ranking.slice(0, 15).map((entry, i) => (
              <RankRow key={entry.id} entry={entry} rank={i} field={tab} />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
