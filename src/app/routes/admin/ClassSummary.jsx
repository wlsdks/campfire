import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, BarChart3, Trophy, Circle, Cloud, MessageSquare, Swords, TextCursorInput, Thermometer, AlertTriangle } from 'lucide-react';
import AchievementSummary from '@/features/quiz/components/AchievementSummary';
import ExportMenu from './ExportMenu';
import ClassInsightCard from '@/features/report/components/ClassInsightCard';

const QTYPE_META = {
  choice: { label: '객관식', icon: BarChart3 },
  quiz: { label: '퀴즈', icon: Trophy },
  ox: { label: 'O/X', icon: Circle },
  wordcloud: { label: '워드클라우드', icon: Cloud },
  qna: { label: 'Q&A', icon: MessageSquare },
  scale: { label: '감정 온도계', icon: Thermometer },
  debate: { label: '찬반 토론', icon: Swords },
  ranking: { label: '순위 맞추기', icon: ArrowUpDown },
  fillinblank: { label: '빈칸 채우기', icon: TextCursorInput },
};

function getQuestionInsights(questions, participantCount) {
  const entries = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  return entries.map(([qId, q]) => {
    const votes = q.votes || {};
    const voteCount = Object.keys(votes).length;
    const responseRate = participantCount > 0 ? Math.round((voteCount / participantCount) * 100) : 0;
    const hasCorrectAnswer = Boolean(q.correctAnswer);
    let correctRate = null;
    let correctCount = 0;

    if (hasCorrectAnswer && voteCount > 0) {
      const isFillBlank = q.type === 'fillinblank';
      const normalizedCA = isFillBlank ? q.correctAnswer.trim().toLowerCase() : q.correctAnswer;
      correctCount = Object.values(votes).filter((v) => {
        if (isFillBlank) return (v.value || '').trim().toLowerCase() === normalizedCA;
        return v.value === q.correctAnswer;
      }).length;
      correctRate = Math.round((correctCount / voteCount) * 100);
    }

    // Confidence analysis (quiz only)
    let highConfidenceRate = null;
    if (hasCorrectAnswer && voteCount > 0) {
      const confVotes = Object.values(votes).filter((v) => v.confidence);
      if (confVotes.length > 0) {
        const highConf = confVotes.filter((v) => v.confidence === 'high').length;
        highConfidenceRate = Math.round((highConf / confVotes.length) * 100);
      }
    }

    return {
      id: qId,
      title: q.title,
      type: q.type,
      voteCount,
      responseRate,
      hasCorrectAnswer,
      correctRate,
      correctCount,
      highConfidenceRate,
    };
  });
}

export default memo(function ClassSummary({ session, participants, scores, leaderboard }) {
  const questions = session?.questions || {};
  const questionList = Object.values(questions);
  const participantCount = Object.keys(participants).length;
  const voterIds = useMemo(() => {
    const ids = new Set();
    questionList.forEach((q) => {
      if (q.votes) Object.keys(q.votes).forEach((pid) => ids.add(pid));
    });
    return [...ids];
  }, [questions]);
  const activeCount = voterIds.length;
  const activityRate = participantCount > 0 ? Math.round((activeCount / participantCount) * 100) : 0;
  const topStudent = leaderboard.length > 0 ? leaderboard[0] : null;

  const insights = getQuestionInsights(questions, participantCount);
  const gradedQuestions = insights.filter((q) => q.hasCorrectAnswer && q.correctRate !== null);
  const avgCorrectRate = gradedQuestions.length > 0
    ? Math.round(gradedQuestions.reduce((s, q) => s + q.correctRate, 0) / gradedQuestions.length)
    : null;
  const hardestQuestion = gradedQuestions.length > 0
    ? gradedQuestions.reduce((min, q) => (q.correctRate < min.correctRate ? q : min), gradedQuestions[0])
    : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">클래스 요약</h2>
          <p className="text-sm text-slate-400 mt-1">
            {session?.courseName} {session?.roundNumber}차
          </p>
        </div>
        {questionList.length > 0 && (
          <ExportMenu session={session} participants={participants} scores={scores} />
        )}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{participantCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">참여자</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{activityRate}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">참여율</p>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${activityRate}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center">
          {avgCorrectRate !== null ? (
            <>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{avgCorrectRate}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">평균 정답률</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{questionList.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">질문</p>
            </>
          )}
        </div>
      </div>

      {/* AI Class Insight */}
      <ClassInsightCard
        session={session}
        participantCount={participantCount}
        insights={insights}
        topStudent={topStudent}
        avgCorrectRate={avgCorrectRate}
        activityRate={activityRate}
      />

      {/* Hardest question callout */}
      {hardestQuestion && hardestQuestion.correctRate < 70 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">가장 어려웠던 질문</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">{hardestQuestion.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              정답률 {hardestQuestion.correctRate}% ({hardestQuestion.correctCount}/{hardestQuestion.voteCount}명 정답)
            </p>
          </div>
        </div>
      )}

      {/* Top student */}
      {topStudent && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-300">
            {topStudent.nickname?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">최고의 학생</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">{topStudent.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{topStudent.total}</p>
            <p className="text-xs text-slate-400">점</p>
          </div>
        </div>
      )}

      {/* Achievement stats */}
      <AchievementSummary questions={questions} scores={scores} participantIds={voterIds} />

      {/* Per-question breakdown */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">질문별 결과</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
            {insights.map((q, i) => {
              const meta = QTYPE_META[q.type] || QTYPE_META.qna;
              const Icon = meta.icon;
              return (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                  <span className="text-xs font-semibold text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-400">{q.voteCount}명 응답</span>
                      {q.hasCorrectAnswer && q.correctRate !== null && (
                        <>
                          <span className="text-slate-200 dark:text-slate-600">&middot;</span>
                          <span className={`text-xs font-medium ${
                            q.correctRate >= 70 ? 'text-slate-600' : q.correctRate >= 40 ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100 font-semibold'
                          }`}>
                            정답률 {q.correctRate}%
                          </span>
                        </>
                      )}
                      {q.highConfidenceRate !== null && (
                        <>
                          <span className="text-slate-200 dark:text-slate-600">&middot;</span>
                          <span className="text-xs text-slate-400">확신 {q.highConfidenceRate}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Response rate bar */}
                  <div className="w-16 shrink-0">
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${q.responseRate}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 + i * 0.05 }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-0.5">{q.responseRate}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 pt-4">왼쪽에서 질문을 클릭하면 결과를 볼 수 있습니다</p>
    </div>
  );
});
