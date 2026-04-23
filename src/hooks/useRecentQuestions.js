import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export function useRecentQuestions(sessions) {
  const [questions, setQuestions] = useState([]);
  const [difficultQuestions, setDifficultQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setQuestions([]);
      setDifficultQuestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      try {
        // Fetch questions from the 10 most recent sessions
        const recentSessions = sessions.slice(0, 10);
        const allQuestions = [];

        for (const s of recentSessions) {
          const snap = await get(ref(db, `sessions/${s.id}/questions`));
          const data = snap.val();
          if (!data) continue;

          const participantSnap = await get(ref(db, `sessions/${s.id}/participants`));
          const participantCount = participantSnap.val() ? Object.keys(participantSnap.val()).length : 0;

          Object.entries(data).forEach(([qId, q]) => {
            const votes = q.votes || {};
            // aiJudge는 votes가 아닌 submissions를 쓰므로 응답수 집계를 submissions 기준으로
            const isAiJudge = q.type === 'aiJudge';
            const responseCount = isAiJudge
              ? Object.keys(q.submissions || {}).length
              : Object.keys(votes).length;
            const hasCorrectAnswer = Boolean(q.correctAnswer);
            let correctRate = null;
            let correctCount = 0;

            if (hasCorrectAnswer && responseCount > 0) {
              const isFillBlank = q.type === 'fillinblank';
              const normalizedCA = isFillBlank ? q.correctAnswer.trim().toLowerCase() : q.correctAnswer;
              correctCount = Object.values(votes).filter((v) => {
                if (isFillBlank) return (v.value || '').trim().toLowerCase() === normalizedCA;
                return v.value === q.correctAnswer;
              }).length;
              correctRate = Math.round((correctCount / responseCount) * 100);
            }

            // Confidence analysis
            let highConfidenceWrongRate = null;
            if (hasCorrectAnswer && responseCount > 0) {
              const confVotes = Object.values(votes).filter((v) => v.confidence === 'high');
              if (confVotes.length > 0) {
                const confWrong = confVotes.filter((v) => v.value !== q.correctAnswer).length;
                highConfidenceWrongRate = Math.round((confWrong / confVotes.length) * 100);
              }
            }

            allQuestions.push({
              qId,
              sessionId: s.id,
              title: q.title || '제목 없음',
              type: q.type || 'choice',
              courseName: s.courseName,
              roundNumber: s.roundNumber,
              responseCount,
              participantCount,
              order: q.order || 0,
              createdAt: s.createdAt || 0,
              hasCorrectAnswer,
              correctRate,
              correctCount,
              highConfidenceWrongRate,
            });
          });
        }

        // Recent: sort by session date (newest first), then by order
        const recent = [...allQuestions]
          .sort((a, b) => b.createdAt - a.createdAt || a.order - b.order)
          .slice(0, 10);

        // Difficult: graded questions with lowest correct rate, minimum 3 responses
        const difficult = allQuestions
          .filter((q) => q.hasCorrectAnswer && q.correctRate !== null && q.responseCount >= 3)
          .sort((a, b) => a.correctRate - b.correctRate || b.responseCount - a.responseCount)
          .slice(0, 5);

        if (!cancelled) {
          setQuestions(recent);
          setDifficultQuestions(difficult);
        }
      } catch (err) {
        logger.error('Failed to fetch recent questions:', err);
        if (!cancelled) {
          setQuestions([]);
          setDifficultQuestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, [sessions]);

  return { questions, difficultQuestions, loading };
}
