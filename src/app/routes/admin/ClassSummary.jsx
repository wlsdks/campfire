import { memo, useMemo } from 'react';
import { BarChart3, Trophy, Circle, Cloud, MessageSquare, Swords, Thermometer, AlertTriangle } from 'lucide-react';
import AchievementSummary from '@/features/quiz/components/AchievementSummary';
import ExportMenu from './ExportMenu';

const QTYPE_META = {
  choice: { label: '객관식', icon: BarChart3 },
  quiz: { label: '퀴즈', icon: Trophy },
  ox: { label: 'O/X', icon: Circle },
  wordcloud: { label: '워드클라우드', icon: Cloud },
  qna: { label: 'Q&A', icon: MessageSquare },
  scale: { label: '감정 온도계', icon: Thermometer },
  debate: { label: '찬반 토론', icon: Swords },
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
      correctCount = Object.values(votes).filter((v) => v.value === q.correctAnswer).length;
      correctRate = Math.round((correctCount / voteCount) * 100);
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
    <div className="w-full max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">클래스 요약</h2>
          <p className="text-sm text-slate-400 mt-1">
            {session?.courseName} {session?.roundNumber}차
          </p>
        </div>
        {questionList.length > 0 && (
          <ExportMenu session={session} participants={participants} scores={scores} />
        )}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{participantCount}</p>
          <p className="text-xs text-slate-400 mt-1">참여자</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{activityRate}%</p>
          <p className="text-xs text-slate-400 mt-1">참여율</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${activityRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          {avgCorrectRate !== null ? (
            <>
              <p className="text-3xl font-bold text-slate-900">{avgCorrectRate}%</p>
              <p className="text-xs text-slate-400 mt-1">평균 정답률</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900">{questionList.length}</p>
              <p className="text-xs text-slate-400 mt-1">질문</p>
            </>
          )}
        </div>
      </div>

      {/* Hardest question callout */}
      {hardestQuestion && hardestQuestion.correctRate < 70 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">가장 어려웠던 질문</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{hardestQuestion.title}</p>
            <p className="text-xs text-slate-500 mt-1">
              정답률 {hardestQuestion.correctRate}% ({hardestQuestion.correctCount}/{hardestQuestion.voteCount}명 정답)
            </p>
          </div>
        </div>
      )}

      {/* Top student */}
      {topStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-600">
            {topStudent.nickname?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">최고의 학생</p>
            <p className="text-base font-bold text-slate-900">{topStudent.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">{topStudent.total}</p>
            <p className="text-xs text-slate-400">점</p>
          </div>
        </div>
      )}

      {/* Achievement stats */}
      <AchievementSummary questions={questions} scores={scores} participantIds={voterIds} />

      {/* Per-question breakdown */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">질문별 결과</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {insights.map((q, i) => {
              const meta = QTYPE_META[q.type] || QTYPE_META.qna;
              const Icon = meta.icon;
              return (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{q.voteCount}명 응답</span>
                      {q.hasCorrectAnswer && q.correctRate !== null && (
                        <>
                          <span className="text-slate-200">&middot;</span>
                          <span className={`text-xs font-medium ${
                            q.correctRate >= 70 ? 'text-slate-600' : q.correctRate >= 40 ? 'text-slate-500' : 'text-slate-900 font-semibold'
                          }`}>
                            정답률 {q.correctRate}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Response rate bar */}
                  <div className="w-16 shrink-0">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all"
                        style={{ width: `${q.responseRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-300 text-right mt-0.5">{q.responseRate}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">왼쪽에서 질문을 클릭하면 결과를 볼 수 있습니다</p>
    </div>
  );
});
