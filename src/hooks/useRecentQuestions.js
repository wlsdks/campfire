import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useRecentQuestions(sessions) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setQuestions([]);
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

          Object.entries(data).forEach(([qId, q]) => {
            const responseCount = q.votes ? Object.keys(q.votes).length : 0;
            allQuestions.push({
              qId,
              sessionId: s.id,
              title: q.title || '제목 없음',
              type: q.type || 'choice',
              courseName: s.courseName,
              responseCount,
              order: q.order || 0,
              createdAt: s.createdAt || 0,
            });
          });
        }

        // Sort by session date (newest first), then by order
        allQuestions.sort((a, b) => b.createdAt - a.createdAt || a.order - b.order);

        if (!cancelled) {
          setQuestions(allQuestions.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch recent questions:', err);
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, [sessions]);

  return { questions, loading };
}
