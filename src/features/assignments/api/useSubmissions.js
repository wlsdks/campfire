import { useState, useEffect, useCallback } from 'react';
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
export async function submitWork(assignmentId, { name, projectUrl, fileContent, fileName, description }) {
  // Check for existing submission by same name
  const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
  const snap = await get(subsRef);
  const existing = snap.val() || {};
  const existingEntry = Object.entries(existing).find(([, v]) => v.name === name);

  if (existingEntry) {
    // Update existing
    const [existingId] = existingEntry;
    await update(ref(db, `assignments/${assignmentId}/submissions/${existingId}`), {
      projectUrl: projectUrl || null,
      fileContent: fileContent || null,
      fileName: fileName || null,
      description: description || null,
      updatedAt: serverTimestamp(),
    });
    return existingId;
  }

  // Create new
  const newRef = push(subsRef);
  await set(newRef, {
    name,
    projectUrl: projectUrl || null,
    fileContent: fileContent || null,
    fileName: fileName || null,
    description: description || null,
    submittedAt: serverTimestamp(),
    updatedAt: null,
  });
  return newRef.key;
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
