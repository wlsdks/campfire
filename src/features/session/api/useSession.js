import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

/** Sentinel value indicating a listener has not yet fired. */
const NOT_LOADED = Symbol('NOT_LOADED');

/** Secondary scalar fields (not used for loading gate). */
const SECONDARY_FIELDS = [
  'currentMode',
  'status',
  'pendingEvent',
  'courseName',
  'courseId',
  'creatorId',
  'roundNumber',
  'createdAt',
  'startedAt',
  'reviewingUntil',
  'drumroll',
  'gameState',
  'persistentAssignmentId',
  'activeAssignmentId',
  'requireEmployeeId',
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
 * opts.participantId(학생): questions 노드에 중첩된 votes 중 "본인 것만" 남기고 타인 votes는
 * 버린다. votes는 sessions/{id}/questions/{qid}/votes/{pid}로 questions 하위에 저장되므로,
 * 옵션 없이 questions 전체를 구독하면 300명 중 누가 1표만 던져도 onValue가 발화→새 questions
 * 객체→VotePage/ActivePollView 전체 리렌더(타인 투표마다 전 학생 단말이 리렌더되는 fan-out).
 * 본인 투표만 유지하고 메타+본인투표 시그니처가 불변이면 setState를 스킵해, 학생은 "본인이
 * 투표할 때"만 리렌더한다. useAchievements가 q.votes[본인]을 읽으므로 본인 표는 보존 필요.
 * 강사/리포트(participantId 없음)는 전체 votes 유지(기존 동작 불변).
 *
 * @param {string} sessionId
 * @param {{ participantId?: string }} [opts]
 * @returns {{ session: object|null, loading: boolean }}
 */
export function useSession(sessionId, { participantId } = {}) {
  // currentQuestion tracked separately — it gates the loading state.
  const [currentQuestion, setCurrentQuestion] = useState(NOT_LOADED);
  const [questions, setQuestions] = useState(NOT_LOADED);
  const [fields, setFields] = useState(NOT_LOADED);
  const prevQSigRef = useRef(null); // 학생: 메타+본인투표 시그니처 — 불변 시 리렌더 스킵

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
    unsubs.push(onValue(qRef, (snap) => {
      const raw = snap.val() || {};
      if (!participantId) { setQuestions(raw); return; } // 강사/리포트: 전체 votes 유지
      // 학생: 타인 votes 제거(본인 것만) → 타인 투표마다 리렌더되던 fan-out 차단
      const stripped = {};
      for (const qid in raw) {
        const q = raw[qid];
        if (q && q.votes) {
          const mine = q.votes[participantId];
          stripped[qid] = { ...q, votes: mine !== undefined ? { [participantId]: mine } : {} };
        } else {
          stripped[qid] = q;
        }
      }
      const sig = JSON.stringify(stripped); // 메타+본인투표만 담겨 가벼움(300표 배열 없음)
      if (sig === prevQSigRef.current) return; // 타인 투표만 변함 → 스킵(리렌더 없음)
      prevQSigRef.current = sig;
      setQuestions(stripped);
    }));

    // Secondary fields — not gated for loading
    for (const key of SECONDARY_FIELDS) {
      const fieldRef = ref(db, `sessions/${sessionId}/${key}`);
      unsubs.push(onValue(fieldRef, (snap) => setField(key, snap.val())));
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      prevQSigRef.current = null;
      setCurrentQuestion(NOT_LOADED);
      setQuestions(NOT_LOADED);
      setFields(NOT_LOADED);
    };
  }, [sessionId, setField, participantId]);

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

/**
 * 경량 세션 메타 훅 — startedAt/status 스칼라 2개만 구독.
 * StudentHeader처럼 경과시간만 필요한 컴포넌트가 full useSession(questions+13필드)을
 * 중복 구독하던 것을 방지(학생 단말마다 불필요한 무거운 리스너 제거).
 * @param {string} sessionId
 * @returns {{ startedAt: number|null, status: string|null }}
 */
export function useSessionMeta(sessionId) {
  const [meta, setMeta] = useState({ startedAt: null, status: null });
  useEffect(() => {
    if (!sessionId) return;
    const unsubA = onValue(ref(db, `sessions/${sessionId}/startedAt`), (s) => setMeta((m) => ({ ...m, startedAt: s.val() })));
    const unsubB = onValue(ref(db, `sessions/${sessionId}/status`), (s) => setMeta((m) => ({ ...m, status: s.val() })));
    return () => { unsubA(); unsubB(); };
  }, [sessionId]);
  return meta;
}
