import { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, serverTimestamp, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { JUDGES } from '@/features/assignments/api/judges';

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
 * 신 폼: prdContent(텍스트) + screenshots(URL 배열) + code(HTML, 선택).
 */
export async function submitWork(assignmentId, { name, pin, prdContent, screenshots, code }, options = {}) {
  const { allowUpdate = false } = options;
  const subsRef = ref(db, `assignments/${assignmentId}/submissions`);
  const snap = await get(subsRef);
  const existing = snap.val() || {};
  const existingEntry = Object.entries(existing).find(([, v]) => v.name === name);

  const data = {
    prdContent: prdContent || null,
    screenshots: Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : null,
    code: code || null,
  };

  if (existingEntry) {
    const [existingId, existingData] = existingEntry;
    if (!allowUpdate) {
      throw new Error('NAME_TAKEN');
    }
    // allowUpdate=true → 호출자(LookupForm)가 PIN 검증을 이미 함. 기존 PIN 보존.
    await update(ref(db, `assignments/${assignmentId}/submissions/${existingId}`), {
      ...data,
      pin: existingData.pin || null,
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
 * exportResultsCSV — 심사 결과를 CSV로 다운로드.
 * BOM 포함하여 한국어 Excel 호환.
 */
export function exportResultsCSV(submissions, results, passThreshold = 3) {
  const header = ['순위', '이름', '평균점수', '합격', '선택수', ...JUDGES.map(j => j.name), 'URL'];

  const sorted = [...submissions].sort((a, b) => {
    const ra = results[a.id]?.summary?.avgScore || 0;
    const rb = results[b.id]?.summary?.avgScore || 0;
    return rb - ra;
  });

  const rows = sorted.map((sub, i) => {
    const r = results[sub.id];
    const summary = r?.summary;
    const judgeScores = JUDGES.map(j => r?.judges?.[j.id]?.score ?? '');
    const passed = summary && (summary.selectedCount ?? 0) >= passThreshold;
    return [
      i + 1,
      sub.name,
      summary?.avgScore ?? '',
      passed ? 'O' : 'X',
      summary?.selectedCount ?? '',
      ...judgeScores,
      sub.projectUrl || '',
    ];
  });

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `심사결과_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
