import { ref, onValue, push, update, remove, serverTimestamp } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

const COOLDOWN_MS = 3000;

/**
 * Real-time class questions hook.
 * Students post named questions; anyone can upvote; instructor marks answered.
 * @param {string} sessionId
 * @returns {{ questions: Array, postQuestion: Function, toggleUpvote: Function, markAnswered: Function, dismissQuestion: Function, loading: boolean, canPost: boolean }}
 */
export function useClassQuestions(sessionId) {
  const [raw, setRaw] = useState({});
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(true);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    const qRef = ref(db, `sessions/${sessionId}/classQuestions`);
    const unsub = onValue(qRef, (snap) => {
      setRaw(snap.val() || {});
      setLoading(false);
    });
    return () => {
      unsub();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [sessionId]);

  // Sorted: unanswered first (by upvote count desc), then answered
  const questions = Object.entries(raw)
    .map(([id, data]) => ({
      id,
      ...data,
      upvoteCount: data.upvotes ? Object.keys(data.upvotes).length : 0,
      answerList: data.answers
        ? Object.entries(data.answers)
            .map(([aId, a]) => ({ id: aId, ...a, upvoteCount: a.upvotes ? Object.keys(a.upvotes).length : 0 }))
            .sort((a, b) => b.upvoteCount - a.upvoteCount || (a.timestamp || 0) - (b.timestamp || 0))
        : [],
      answerCount: data.answers ? Object.keys(data.answers).length : 0,
    }))
    .sort((a, b) => {
      if (a.answered !== b.answered) return a.answered ? 1 : -1;
      return b.upvoteCount - a.upvoteCount || (b.timestamp || 0) - (a.timestamp || 0);
    });

  const unansweredCount = questions.filter((q) => !q.answered).length;

  const postQuestion = useCallback(
    async (text, nickname, participantId) => {
      const trimmed = text?.trim();
      if (!sessionId || !trimmed || !canPost) return false;
      try {
        await push(ref(db, `sessions/${sessionId}/classQuestions`), {
          text: trimmed,
          nickname: nickname || '익명',
          participantId: participantId || '',
          timestamp: serverTimestamp(),
          answered: false,
        });
        setCanPost(false);
        cooldownRef.current = setTimeout(() => setCanPost(true), COOLDOWN_MS);
        return true;
      } catch (err) {
        logger.error('Post class question failed:', err);
        return false;
      }
    },
    [sessionId, canPost],
  );

  const toggleUpvote = useCallback(
    async (questionId, participantId) => {
      if (!sessionId || !questionId || !participantId) return;
      const upRef = ref(
        db,
        `sessions/${sessionId}/classQuestions/${questionId}/upvotes/${participantId}`,
      );
      const current = raw[questionId]?.upvotes?.[participantId];
      try {
        if (current) {
          await remove(upRef);
        } else {
          await update(
            ref(db, `sessions/${sessionId}/classQuestions/${questionId}/upvotes`),
            { [participantId]: true },
          );
        }
      } catch (err) {
        logger.error('Toggle upvote failed:', err);
      }
    },
    [sessionId, raw],
  );

  const markAnswered = useCallback(
    async (questionId, answeredBy, answeredByRole) => {
      if (!sessionId || !questionId) return;
      try {
        const data = { answered: true };
        if (answeredBy) data.answeredBy = answeredBy;
        if (answeredByRole) data.answeredByRole = answeredByRole;
        await update(ref(db, `sessions/${sessionId}/classQuestions/${questionId}`), data);
      } catch (err) {
        logger.error('Mark answered failed:', err);
      }
    },
    [sessionId],
  );

  const dismissQuestion = useCallback(
    async (questionId) => {
      if (!sessionId || !questionId) return;
      try {
        await remove(ref(db, `sessions/${sessionId}/classQuestions/${questionId}`));
      } catch (err) {
        logger.error('Dismiss class question failed:', err);
      }
    },
    [sessionId],
  );

  const postAnswer = useCallback(
    async (questionId, text, nickname, participantId) => {
      const trimmed = text?.trim();
      if (!sessionId || !questionId || !trimmed) return false;
      try {
        await push(ref(db, `sessions/${sessionId}/classQuestions/${questionId}/answers`), {
          text: trimmed,
          nickname: nickname || '익명',
          participantId: participantId || '',
          timestamp: serverTimestamp(),
        });
        return true;
      } catch (err) {
        logger.error('Post answer failed:', err);
        return false;
      }
    },
    [sessionId],
  );

  const toggleAnswerUpvote = useCallback(
    async (questionId, answerId, participantId) => {
      if (!sessionId || !questionId || !answerId || !participantId) return;
      const upRef = ref(
        db,
        `sessions/${sessionId}/classQuestions/${questionId}/answers/${answerId}/upvotes/${participantId}`,
      );
      const current = raw[questionId]?.answers?.[answerId]?.upvotes?.[participantId];
      try {
        if (current) {
          await remove(upRef);
        } else {
          await update(
            ref(db, `sessions/${sessionId}/classQuestions/${questionId}/answers/${answerId}/upvotes`),
            { [participantId]: true },
          );
        }
      } catch (err) {
        logger.error('Toggle answer upvote failed:', err);
      }
    },
    [sessionId, raw],
  );

  return {
    questions,
    unansweredCount,
    postQuestion,
    toggleUpvote,
    markAnswered,
    dismissQuestion,
    postAnswer,
    toggleAnswerUpvote,
    loading,
    canPost,
  };
}
