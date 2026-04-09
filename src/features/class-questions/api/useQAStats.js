import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';

/**
 * Real-time Q&A participation stats.
 * Reads sessions/{sessionId}/qaStats and returns sorted rankings.
 */
export function useQAStats(sessionId) {
  const [raw, setRaw] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const statsRef = ref(db, `sessions/${sessionId}/qaStats`);
    const unsub = onValue(statsRef, (snap) => {
      setRaw(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId]);

  const stats = useMemo(() => {
    return Object.entries(raw).map(([pid, data]) => ({
      id: pid,
      nickname: data.nickname || '익명',
      questions: data.questions || 0,
      answers: data.answers || 0,
      total: (data.questions || 0) + (data.answers || 0),
    }));
  }, [raw]);

  // 종합 랭킹 (질문+답변 합산)
  const totalRanking = useMemo(
    () => [...stats].sort((a, b) => b.total - a.total || b.answers - a.answers),
    [stats],
  );

  // 질문왕
  const questionRanking = useMemo(
    () => [...stats].filter(s => s.questions > 0).sort((a, b) => b.questions - a.questions),
    [stats],
  );

  // 답변왕
  const answerRanking = useMemo(
    () => [...stats].filter(s => s.answers > 0).sort((a, b) => b.answers - a.answers),
    [stats],
  );

  const totalQuestions = useMemo(() => stats.reduce((sum, s) => sum + s.questions, 0), [stats]);
  const totalAnswers = useMemo(() => stats.reduce((sum, s) => sum + s.answers, 0), [stats]);

  return { stats, totalRanking, questionRanking, answerRanking, totalQuestions, totalAnswers, loading };
}
