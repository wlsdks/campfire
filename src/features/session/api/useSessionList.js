import { ref, get } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

/**
 * Fetches all sessions from Firebase with metadata including course info.
 * Uses get() for one-time fetch.
 *
 * @returns {{ sessions: Array, loading: boolean, refresh: Function }}
 */
export function useSessionList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchSessions() {
    setLoading(true);
    try {
      const snap = await get(ref(db, 'sessions'));
      const data = snap.val();
      if (!data) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const list = Object.entries(data).map(([id, session]) => {
        const participants = session.participants || {};
        const questions = session.questions || {};
        const participantCount = Object.keys(participants).length;
        const questionCount = Object.keys(questions).length;

        // Calculate activity rate: participants who voted at least once
        let activeCount = 0;
        const participantIds = new Set(Object.keys(participants));
        const allQuestions = Object.values(questions);
        const voterIds = new Set();
        allQuestions.forEach((q) => {
          if (q.votes) {
            Object.keys(q.votes).forEach((pid) => {
              if (participantIds.has(pid)) voterIds.add(pid);
            });
          }
        });
        activeCount = voterIds.size;
        const activityRate = participantCount > 0
          ? Math.round((activeCount / participantCount) * 100)
          : 0;

        return {
          id,
          status: session.status || 'active',
          createdAt: session.createdAt || 0,
          participantCount,
          questionCount,
          activityRate,
          courseName: session.courseName || null,
          roundNumber: session.roundNumber || null,
          courseTemplateId: session.courseTemplateId || null,
        };
      });

      list.sort((a, b) => b.createdAt - a.createdAt);
      setSessions(list);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, loading, refresh: fetchSessions };
}
