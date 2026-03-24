import { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, serverTimestamp, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

/**
 * useSubmissionList — 과제의 제출물 목록 구독.
 */
export function useSubmissionList(assignmentId) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) { setSubmissions([]); setLoading(false); return; }

    const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
    const unsub = onValue(subsRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      setSubmissions(list);
      setLoading(false);
    }, (err) => {
      logger.error('제출물 목록 로드 실패:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [assignmentId]);

  return { submissions, loading, count: submissions.length };
}

/**
 * submitWork — 학생이 과제를 제출.
 * 같은 이름이면 기존 제출물을 업데이트.
 */
export async function submitWork(assignmentId, { name, pin, projectUrl, fileContent, fileName, prdContent, prdFileName, description }) {
  const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
  const snap = await get(subsRef);
  const existing = snap.val() || {};
  const existingEntry = Object.entries(existing).find(([, v]) => v.name === name);

  const data = {
    projectUrl: projectUrl || null,
    fileContent: fileContent || null,
    fileName: fileName || null,
    prdContent: prdContent || null,
    prdFileName: prdFileName || null,
    description: description || null,
  };

  if (existingEntry) {
    const [existingId, existingData] = existingEntry;
    // 비밀번호 검증 (기존 제출물에 pin이 있으면)
    if (existingData.pin && existingData.pin !== pin) {
      throw new Error('PIN_MISMATCH');
    }
    await update(ref(db, `assignments/${assignmentId}/submissions/${existingId}`), {
      ...data,
      pin: pin || existingData.pin || null,
      updatedAt: serverTimestamp(),
    });
    return existingId;
  }

  const newRef = push(subsRef);
  await set(newRef, {
    name,
    pin: pin || null,
    ...data,
    submittedAt: serverTimestamp(),
    updatedAt: null,
  });
  return newRef.key;
}

/**
 * lookupSubmission — 이름 + 비밀번호로 제출물 조회 (비회원 주문 조회 방식).
 */
export async function lookupSubmission(assignmentId, name, pin) {
  const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
  const snap = await get(subsRef);
  const data = snap.val() || {};
  const entry = Object.entries(data).find(([, v]) => v.name === name);
  if (!entry) return { error: 'NOT_FOUND' };

  const [id, sub] = entry;
  if (sub.pin && sub.pin !== pin) return { error: 'PIN_MISMATCH' };
  return { submission: { id, ...sub } };
}

/**
 * withdrawSubmission — 제출물 취소 (삭제).
 */
export async function withdrawSubmission(assignmentId, submissionId) {
  const subRef = ref(db, `assignments/${assignmentId}/submissions/${submissionId}`);
  await set(subRef, null);
}

/**
 * findSubmissionByName — 이름으로 제출물 찾기 (결과 확인 시).
 */
export async function findSubmissionByName(assignmentId, name) {
  const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
  const snap = await get(subsRef);
  const data = snap.val() || {};
  const entry = Object.entries(data).find(([, v]) => v.name === name);
  return entry ? { id: entry[0], ...entry[1] } : null;
}

/**
 * useSubmissionResults — 특정 제출물의 심사 결과 구독.
 */
export function useSubmissionResults(assignmentId, submissionId) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId || !submissionId) { setResults(null); setLoading(false); return; }

    const resultsRef = ref(db, `assignments/${assignmentId}/results/${submissionId}`);
    const unsub = onValue(resultsRef, (snap) => {
      setResults(snap.exists() ? snap.val() : null);
      setLoading(false);
    });

    return () => unsub();
  }, [assignmentId, submissionId]);

  return { results, loading };
}
