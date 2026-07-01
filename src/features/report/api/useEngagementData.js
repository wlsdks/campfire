import { useState, useCallback, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { isAnswerCorrect } from '@/lib/quiz';

/**
 * useEngagementData — 세션별 학생 참여도 데이터를 한 번에 가져옴.
 * 실시간 구독이 아닌 일회성 fetch (수업 후 리포트 용도).
 */
export function useEngagementData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  const fetchEngagement = useCallback(async (sessionId) => {
    if (!sessionId) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const [participantsSnap, questionsSnap, scoresSnap] = await Promise.all([
        get(ref(db, `sessions/${sessionId}/participants`)),
        get(ref(db, `sessions/${sessionId}/questions`)),
        get(ref(db, `sessions/${sessionId}/scores`)),
      ]);

      // Discard stale response if user switched sessions during fetch
      if (requestId !== requestRef.current) return;

      const participants = participantsSnap.val() || {};
      const questions = questionsSnap.val() || {};
      const scores = scoresSnap.val() || {};

      const questionEntries = Object.entries(questions)
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
      const totalQuestions = questionEntries.length;
      const totalQuiz = questionEntries.filter(([, q]) => !!q.correctAnswer).length;

      const students = Object.entries(participants).map(([pid, pData]) => {
        let answered = 0;
        let correct = 0;

        questionEntries.forEach(([, q]) => {
          const vote = q.votes?.[pid];
          if (vote) {
            answered++;
            if (isAnswerCorrect(q, vote.value)) { // 텍스트형 공백·대소문자 무시
              correct++;
            }
          }
        });

        const scoreData = scores[pid];
        const engagementRate = totalQuestions > 0
          ? Math.round((answered / totalQuestions) * 100)
          : 0;
        const correctRate = totalQuiz > 0 && answered > 0
          ? Math.round((correct / totalQuiz) * 100)
          : null;

        return {
          id: pid,
          nickname: scoreData?.nickname || pData.nickname || '익명',
          answered,
          totalQuestions,
          engagementRate,
          correctRate,
          totalScore: scoreData?.total || 0,
          joinedAt: pData.joinedAt || null,
          online: pData.online || false,
        };
      });

      students.sort((a, b) => b.engagementRate - a.engagementRate || b.totalScore - a.totalScore);

      const totalStudents = students.length;
      const avgEngagement = totalStudents > 0
        ? Math.round(students.reduce((sum, st) => sum + st.engagementRate, 0) / totalStudents)
        : 0;
      const fullParticipation = students.filter(st => st.engagementRate === 100).length;
      const zeroParticipation = students.filter(st => st.engagementRate === 0).length;
      const completionRate = totalStudents > 0
        ? Math.round((fullParticipation / totalStudents) * 100)
        : 0;

      setData({
        students,
        summary: {
          totalStudents,
          totalQuestions,
          avgEngagement,
          fullParticipation,
          zeroParticipation,
          completionRate,
        },
      });
    } catch (err) {
      if (requestId !== requestRef.current) return;
      logger.error('참여도 데이터 로드 실패:', err);
      setData(null);
      setError(err);
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { data, loading, error, fetchEngagement };
}
