import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';

/** Sentinel value indicating a listener has not yet fired. */
const NOT_LOADED = Symbol('NOT_LOADED');

/** Secondary scalar fields (not used for loading gate). */
const SECONDARY_FIELDS = [
  'currentMode',
  'status',
  'pendingEvent',
  'courseName',
  'roundNumber',
  'createdAt',
  'startedAt',
  'reviewingUntil',
  'drumroll',
  'gameState',
];

/**
 * Subscribes to session-level metadata and questions separately,
 * avoiding a single listener on the entire session tree.
 *
 * Heavy nested data (participants, handRaises, urgentQuestions,
 * reactions, scores) are handled by their own dedicated hooks
 * and are NOT fetched here.
 *
 * Each secondary field is a separate listener on a scalar path,
 * which is efficient: Firebase RTDB only transfers the tiny scalar
 * value, not the entire session. 10 lightweight listeners < 1 heavy
 * listener on the session root (which would include participants etc.).
 *
 * @param {string} sessionId
 * @returns {{ session: object|null, loading: boolean }}
 */
export function useSession(sessionId) {
  // currentQuestion tracked separately — it gates the loading state.
  const [currentQuestion, setCurrentQuestion] = useState(NOT_LOADED);
  const [questions, setQuestions] = useState(NOT_LOADED);
  const [fields, setFields] = useState(NOT_LOADED);

  const setField = useCallback((key, value) => {
    setFields((prev) => {
      const base = prev === NOT_LOADED ? {} : prev;
      return { ...base, [key]: value };
    });
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const unsubs = [];

    // currentQuestion — critical for loading gate
    const cqRef = ref(db, `sessions/${sessionId}/currentQuestion`);
    unsubs.push(onValue(cqRef, (snap) => setCurrentQuestion(snap.val())));

    // Questions — critical for loading gate
    const qRef = ref(db, `sessions/${sessionId}/questions`);
    unsubs.push(onValue(qRef, (snap) => setQuestions(snap.val() || {})));

    // Secondary fields — not gated for loading
    for (const key of SECONDARY_FIELDS) {
      const fieldRef = ref(db, `sessions/${sessionId}/${key}`);
      unsubs.push(onValue(fieldRef, (snap) => setField(key, snap.val())));
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      setCurrentQuestion(NOT_LOADED);
      setQuestions(NOT_LOADED);
      setFields(NOT_LOADED);
    };
  }, [sessionId, setField]);

  // Loading gates on the two critical pieces: currentQuestion + questions
  const loading = useMemo(() => {
    if (!sessionId) return false;
    return currentQuestion === NOT_LOADED || questions === NOT_LOADED;
  }, [sessionId, currentQuestion, questions]);

  const session = useMemo(() => {
    if (loading) return null;
    const result = {
      currentQuestion: currentQuestion ?? null,
      questions: questions ?? {},
    };
    for (const key of SECONDARY_FIELDS) {
      result[key] = fields === NOT_LOADED ? null : (fields[key] ?? null);
    }
    return result;
  }, [loading, currentQuestion, questions, fields]);

  return { session, loading };
}
