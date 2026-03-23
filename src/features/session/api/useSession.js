import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';

/** Sentinel value indicating a listener has not yet fired. */
const NOT_LOADED = Symbol('NOT_LOADED');

/** Session-level scalar fields to subscribe individually. */
const SCALAR_FIELDS = [
  'currentQuestion',
  'currentMode',
  'status',
  'pendingEvent',
  'courseName',
  'roundNumber',
  'createdAt',
  'startedAt',
  'reviewingUntil',
];

/**
 * Subscribes to session-level metadata and questions separately,
 * avoiding a single listener on the entire session tree.
 *
 * Heavy nested data (participants, handRaises, urgentQuestions,
 * reactions, scores) are handled by their own dedicated hooks
 * and are NOT fetched here.
 *
 * @param {string} sessionId
 * @returns {{ session: object|null, loading: boolean }}
 */
export function useSession(sessionId) {
  const [fields, setFields] = useState(NOT_LOADED);
  const [questions, setQuestions] = useState(NOT_LOADED);

  const setField = useCallback((key, value) => {
    setFields((prev) => {
      const base = prev === NOT_LOADED ? {} : prev;
      return { ...base, [key]: value };
    });
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const unsubs = [];

    // Subscribe to each scalar field individually to avoid
    // downloading heavy nested data on every change.
    for (const key of SCALAR_FIELDS) {
      const fieldRef = ref(db, `sessions/${sessionId}/${key}`);
      unsubs.push(onValue(fieldRef, (snap) => setField(key, snap.val())));
    }

    // Questions listener kept separate — it's the largest payload.
    const qRef = ref(db, `sessions/${sessionId}/questions`);
    unsubs.push(onValue(qRef, (snap) => setQuestions(snap.val() || {})));

    return () => {
      unsubs.forEach((unsub) => unsub());
      setFields(NOT_LOADED);
      setQuestions(NOT_LOADED);
    };
  }, [sessionId, setField]);

  const loading = useMemo(() => {
    if (!sessionId) return false;
    return fields === NOT_LOADED || questions === NOT_LOADED;
  }, [sessionId, fields, questions]);

  const session = useMemo(() => {
    if (loading) return null;
    const result = { questions: questions ?? {} };
    for (const key of SCALAR_FIELDS) {
      result[key] = fields[key] ?? null;
    }
    return result;
  }, [loading, fields, questions]);

  return { session, loading };
}
