import { ref, onValue, push, update, remove, serverTimestamp, increment, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { generateStaffAnswer, isAiAnswerReady } from './aiAnswer';

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
  const [canAnswer, setCanAnswer] = useState(true);
  const cooldownRef = useRef(null);
  const answerCooldownRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    // limitToLast로 누적 질문 무한 다운로드 방지 — 최근 100개만 구독
    const qRef = query(ref(db, `sessions/${sessionId}/classQuestions`), limitToLast(100));
    const unsub = onValue(qRef, (snap) => {
      setRaw(snap.val() || {});
      setLoading(false);
    });
    return () => {
      unsub();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (answerCooldownRef.current) clearTimeout(answerCooldownRef.current);
    };
  }, [sessionId]);

  // Sorted: unanswered first (by upvote count desc), then answered
  const questions = useMemo(
    () =>
      Object.entries(raw)
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
        }),
    [raw]
  );

  const unansweredCount = useMemo(
    () => questions.filter((q) => !q.answered).length,
    [questions]
  );

  const postQuestion = useCallback(
    async (text, nickname, participantId, options = {}) => {
      const { aiAllowed = false, sessionContext = '' } = options;
      const trimmed = text?.trim();
      if (!sessionId || !trimmed || !canPost) return false;
      try {
        const newRef = await push(ref(db, `sessions/${sessionId}/classQuestions`), {
          text: trimmed,
          nickname: nickname || '익명',
          participantId: participantId || '',
          timestamp: serverTimestamp(),
          answered: false,
          aiAllowed: !!aiAllowed,
        });
        const qId = newRef.key;
        // Q&A 참여 통계 업데이트
        if (participantId) {
          update(ref(db, `sessions/${sessionId}/qaStats/${participantId}`), {
            nickname: nickname || '익명',
            questions: increment(1),
          }).catch(() => {});
        }
        // AI 답변 요청 시 비동기 처리
        if (aiAllowed && isAiAnswerReady()) {
          (async () => {
            try {
              const r = await generateStaffAnswer({ question: trimmed, sessionContext });
              if (r?.canAnswer && r.answer?.trim()) {
                const answerData = {
                  text: r.answer.trim(),
                  nickname: 'AI 조교',
                  participantId: 'ai-bot',
                  timestamp: serverTimestamp(),
                  role: 'ai',
                };
                await push(ref(db, `sessions/${sessionId}/classQuestions/${qId}/answers`), answerData);
                await update(ref(db, `sessions/${sessionId}/classQuestions/${qId}`), {
                  answered: true,
                  answeredBy: 'AI 조교',
                  answeredByRole: 'ai',
                });
              } else {
                // AI가 답변 불가 → 마커 남김 (UI에서 "AI는 답변 생략" 같이 표시 가능)
                await update(ref(db, `sessions/${sessionId}/classQuestions/${qId}`), {
                  aiSkipped: true,
                });
              }
            } catch (err) {
              logger.error('AI answer failed:', err);
              update(ref(db, `sessions/${sessionId}/classQuestions/${qId}`), { aiSkipped: true }).catch(() => {});
            }
          })();
        }
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

  const toggleHidden = useCallback(
    async (questionId) => {
      if (!sessionId || !questionId) return;
      try {
        const current = raw[questionId]?.hidden || false;
        await update(ref(db, `sessions/${sessionId}/classQuestions/${questionId}`), {
          hidden: !current,
        });
      } catch (err) {
        logger.error('Toggle hidden failed:', err);
      }
    },
    [sessionId, raw],
  );

  const postAnswer = useCallback(
    async (questionId, text, nickname, participantId, role) => {
      const trimmed = text?.trim();
      if (!sessionId || !questionId || !trimmed || !canAnswer) return false;
      try {
        const answerData = {
          text: trimmed,
          nickname: nickname || '익명',
          participantId: participantId || '',
          timestamp: serverTimestamp(),
        };
        if (role === 'admin' || role === 'staff') answerData.role = role;
        await push(ref(db, `sessions/${sessionId}/classQuestions/${questionId}/answers`), answerData);
        // Q&A 참여 통계 업데이트
        if (participantId) {
          update(ref(db, `sessions/${sessionId}/qaStats/${participantId}`), {
            nickname: nickname || '익명',
            answers: increment(1),
          }).catch(() => {});
        }
        // 강사/스태프 답변만 answered 마킹 (학생 답변은 마킹하지 않음)
        if (role === 'admin' || role === 'staff') {
          await update(ref(db, `sessions/${sessionId}/classQuestions/${questionId}`), {
            answered: true,
            answeredBy: nickname || '익명',
            answeredByRole: role,
          });
        }
        setCanAnswer(false);
        answerCooldownRef.current = setTimeout(() => setCanAnswer(true), COOLDOWN_MS);
        return true;
      } catch (err) {
        logger.error('Post answer failed:', err);
        return false;
      }
    },
    [sessionId, canAnswer],
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
    toggleHidden,
    postAnswer,
    toggleAnswerUpvote,
    loading,
    canPost,
    canAnswer,
  };
}
