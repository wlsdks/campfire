import { useMemo } from 'react';
import { useSession } from '@/features/session/api/useSession';
import { useScores } from '@/features/quiz/api/useScores';
import { computeAchievements } from '@/features/quiz/api/useAchievements';

const TYPE_LABELS = {
  choice: '객관식', ox: 'O/X', quiz: '퀴즈', wordcloud: '워드클라우드',
  qna: 'Q&A', scale: '감정 온도계', debate: '찬반 토론',
  ranking: '순위 맞추기', fillinblank: '빈칸 채우기',
};

/**
 * Loads all data needed for a student's learning report.
 * Accepts participantId as a parameter (from URL) instead of localStorage.
 *
 * @param {string} sessionId
 * @param {string} participantId
 */
export function useReportData(sessionId, participantId) {
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { scores, leaderboard } = useScores(sessionId);

  const stats = useMemo(() => {
    if (!session || !participantId) return null;

    const questions = session.questions || {};
    const questionEntries = Object.entries(questions)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

    let answered = 0, correct = 0, gradable = 0;

    const questionDetails = questionEntries.map(([qId, q]) => {
      const myVote = q.votes?.[participantId];
      const hasAnswer = !!q.correctAnswer;
      const isCorrect = hasAnswer && myVote?.value === q.correctAnswer;

      if (myVote) answered++;
      if (hasAnswer && myVote) {
        gradable++;
        if (isCorrect) correct++;
      }

      return {
        id: qId,
        title: q.title,
        type: q.type,
        typeLabel: TYPE_LABELS[q.type] || q.type,
        myAnswer: myVote?.value || null,
        correctAnswer: q.correctAnswer || null,
        isCorrect: hasAnswer ? isCorrect : null,
        answered: !!myVote,
      };
    });

    const myScore = scores[participantId];
    const rankIdx = leaderboard.findIndex((e) => e.id === participantId);

    return {
      nickname: myScore?.nickname || null,
      courseName: session.courseName,
      roundNumber: session.roundNumber,
      answeredCount: answered,
      totalQuestions: questionEntries.length,
      correctRate: gradable > 0 ? Math.round((correct / gradable) * 100) : null,
      totalScore: myScore?.total || 0,
      bestStreak: myScore?.bestStreak || myScore?.streak || 0,
      rank: rankIdx >= 0 ? rankIdx + 1 : 0,
      totalParticipants: leaderboard.length,
      questionDetails,
    };
  }, [session, scores, leaderboard, participantId]);

  const achievements = useMemo(() => {
    if (!session || !participantId) return [];
    return computeAchievements(session.questions, participantId, scores);
  }, [session, participantId, scores]);

  return {
    stats,
    achievements,
    loading: sessionLoading,
  };
}
