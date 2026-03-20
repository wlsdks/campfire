import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';

/** Sentinel value indicating a listener has not yet fired. */
const NOT_LOADED = Symbol('NOT_LOADED');

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
  const [currentQuestion, setCurrentQuestion] = useState(NOT_LOADED);
  const [currentMode, setCurrentMode] = useState(NOT_LOADED);
  const [status, setStatus] = useState(NOT_LOADED);
  const [pendingEvent, setPendingEvent] = useState(NOT_LOADED);
  const [questions, setQuestions] = useState(NOT_LOADED);
  const [courseName, setCourseName] = useState(NOT_LOADED);
  const [roundNumber, setRoundNumber] = useState(NOT_LOADED);
  const [createdAt, setCreatedAt] = useState(NOT_LOADED);
  const [startedAt, setStartedAt] = useState(NOT_LOADED);
  const [reviewingUntil, setReviewingUntil] = useState(NOT_LOADED);

  useEffect(() => {
    if (!sessionId) return;

    // Reset to NOT_LOADED when sessionId changes. These are inside
    // the onValue callbacks, not directly in the effect body.
    // Firebase onValue fires immediately with cached/server data,
    // so the NOT_LOADED state is transient.

    const unsubs = [];

    const cqRef = ref(db, `sessions/${sessionId}/currentQuestion`);
    unsubs.push(onValue(cqRef, (snap) => setCurrentQuestion(snap.val())));

    const cmRef = ref(db, `sessions/${sessionId}/currentMode`);
    unsubs.push(onValue(cmRef, (snap) => setCurrentMode(snap.val())));

    const sRef = ref(db, `sessions/${sessionId}/status`);
    unsubs.push(onValue(sRef, (snap) => setStatus(snap.val())));

    const peRef = ref(db, `sessions/${sessionId}/pendingEvent`);
    unsubs.push(onValue(peRef, (snap) => setPendingEvent(snap.val())));

    const qRef = ref(db, `sessions/${sessionId}/questions`);
    unsubs.push(onValue(qRef, (snap) => setQuestions(snap.val() || {})));

    const cnRef = ref(db, `sessions/${sessionId}/courseName`);
    unsubs.push(onValue(cnRef, (snap) => setCourseName(snap.val())));

    const rnRef = ref(db, `sessions/${sessionId}/roundNumber`);
    unsubs.push(onValue(rnRef, (snap) => setRoundNumber(snap.val())));

    const caRef = ref(db, `sessions/${sessionId}/createdAt`);
    unsubs.push(onValue(caRef, (snap) => setCreatedAt(snap.val())));

    const saRef = ref(db, `sessions/${sessionId}/startedAt`);
    unsubs.push(onValue(saRef, (snap) => setStartedAt(snap.val())));

    const ruRef = ref(db, `sessions/${sessionId}/reviewingUntil`);
    unsubs.push(onValue(ruRef, (snap) => setReviewingUntil(snap.val())));

    return () => {
      unsubs.forEach((unsub) => unsub());
      // Reset on cleanup so next sessionId starts fresh.
      setCurrentQuestion(NOT_LOADED);
      setCurrentMode(NOT_LOADED);
      setStatus(NOT_LOADED);
      setPendingEvent(NOT_LOADED);
      setQuestions(NOT_LOADED);
      setCourseName(NOT_LOADED);
      setRoundNumber(NOT_LOADED);
      setCreatedAt(NOT_LOADED);
      setStartedAt(NOT_LOADED);
      setReviewingUntil(NOT_LOADED);
    };
  }, [sessionId]);

  // Derive loading: either no sessionId (not loading) or waiting for
  // the first listener to fire. We gate on currentQuestion + questions
  // since those are the two most critical pieces of data.
  const loading = useMemo(() => {
    if (!sessionId) return false;
    return currentQuestion === NOT_LOADED || questions === NOT_LOADED;
  }, [sessionId, currentQuestion, questions]);

  // Merge into a single session object for backwards compatibility.
  const session = useMemo(() => {
    if (loading) return null;
    return {
      currentQuestion: currentQuestion ?? null,
      currentMode: currentMode === NOT_LOADED ? null : (currentMode ?? null),
      status: status === NOT_LOADED ? null : (status ?? null),
      pendingEvent: pendingEvent === NOT_LOADED ? null : (pendingEvent ?? null),
      questions: questions ?? {},
      courseName: courseName === NOT_LOADED ? null : (courseName ?? null),
      roundNumber: roundNumber === NOT_LOADED ? null : (roundNumber ?? null),
      createdAt: createdAt === NOT_LOADED ? null : (createdAt ?? null),
      startedAt: startedAt === NOT_LOADED ? null : (startedAt ?? null),
      reviewingUntil: reviewingUntil === NOT_LOADED ? null : (reviewingUntil ?? null),
    };
  }, [loading, currentQuestion, currentMode, status, pendingEvent, questions, courseName, roundNumber, createdAt, startedAt, reviewingUntil]);

  return { session, loading };
}
