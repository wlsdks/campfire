import { ref, get, remove, set, serverTimestamp } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { generateSessionId, generateQuestionId } from '@/lib/utils';
import { logger } from '@/lib/logger';

/**
 * Fetches sessions from Firebase with metadata including course info.
 * Filters by ownership: master sees all, admin sees own, staff uses separate dashboard.
 *
 * @param {string} [adminUid] - Current admin's uid for ownership filtering
 * @param {string} [role] - 'master' | 'admin' | 'staff'
 * @returns {{ sessions: Array, loading: boolean, refresh: Function }}
 */
export function useSessionList(adminUid, role) {
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
        const totalCount = Object.keys(participants).length;
        const onlineCount = Object.values(participants).filter(p => p.online).length;
        const questionCount = Object.keys(questions).length;

        // Calculate activity rate: participants who voted at least once (based on total, not online)
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
        const activityRate = totalCount > 0
          ? Math.round((activeCount / totalCount) * 100)
          : 0;

        return {
          id,
          status: session.status || 'active',
          createdAt: session.createdAt || 0,
          participantCount: onlineCount,
          totalParticipants: totalCount,
          questionCount,
          activityRate,
          activeCount,
          courseName: session.courseName || null,
          roundNumber: session.roundNumber || null,
          courseTemplateId: session.courseTemplateId || null,
          creatorId: session.creatorId || null,
          courseId: session.courseId || null,
        };
      });

      // Filter by ownership
      let filtered = list;
      if (role === 'admin' && adminUid) {
        filtered = list.filter((s) => s.creatorId === adminUid);
      }

      filtered.sort((a, b) => b.createdAt - a.createdAt);
      setSessions(filtered);
    } catch (err) {
      logger.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await remove(ref(db, `sessions/${sessionId}`));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch (err) {
      logger.error('Failed to delete session:', err);
      return false;
    }
  }, []);

  /**
   * Duplicates a session: copies all questions (stripped of votes/runtime data),
   * same courseName, next roundNumber. Returns newSessionId or null on failure.
   */
  const duplicateSession = useCallback(async (sourceSessionId) => {
    try {
      // Find the source session metadata from our list
      const source = sessions.find((s) => s.id === sourceSessionId);
      if (!source) return null;

      // Determine next round number for this course
      let nextRound = (source.roundNumber || 0) + 1;
      if (source.courseName) {
        const sameCourseSessions = sessions.filter((s) => s.courseName === source.courseName);
        const maxRound = Math.max(0, ...sameCourseSessions.map((s) => s.roundNumber || 0));
        nextRound = maxRound + 1;
      }

      // Fetch source questions from Firebase
      const sourceSnap = await get(ref(db, `sessions/${sourceSessionId}/questions`));
      const sourceQuestions = sourceSnap.val();

      const newId = generateSessionId();
      const sessionData = {
        status: 'setting',
        currentQuestion: null,
        currentMode: 'waiting',
        createdAt: serverTimestamp(),
        courseName: source.courseName || null,
        courseId: source.courseId || null,
        creatorId: source.creatorId || adminUid || null,
        roundNumber: nextRound,
      };

      if (sourceQuestions) {
        const newQuestions = {};
        Object.values(sourceQuestions)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach((q, i) => {
            const newQId = generateQuestionId();
            const {
              votes: _v,
              activatedAt: _a,
              revealedAt: _r,
              awardedAt: _w,
              event: _e,
              ...rest
            } = q;
            newQuestions[newQId] = { ...rest, order: i + 1 };
          });
        sessionData.questions = newQuestions;
      }

      await set(ref(db, `sessions/${newId}`), sessionData);

      // Optimistic update: add to local sessions list
      setSessions((prev) => [{
        id: newId,
        status: 'setting',
        createdAt: Date.now(),
        participantCount: 0,
        totalParticipants: 0,
        questionCount: sourceQuestions ? Object.keys(sourceQuestions).length : 0,
        activityRate: 0,
        activeCount: 0,
        courseName: source.courseName || null,
        roundNumber: nextRound,
        courseTemplateId: null,
      }, ...prev]);

      return newId;
    } catch (err) {
      logger.error('Failed to duplicate session:', err);
      return null;
    }
  }, [sessions]);

  return { sessions, loading, refresh: fetchSessions, deleteSession, duplicateSession };
}
