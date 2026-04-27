import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, push, set, update, remove, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export const ASSIGNMENT_STATUS = {
  open: '제출 중',
  closed: '마감',
  judging: '심사 중',
  judged: '심사 완료',
};

/**
 * useAssignmentList — 과제 목록 구독.
 * courseName이 없으면 전체 목록, 있으면 해당 코스만 필터.
 */
export function useAssignmentList(courseName) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assignmentsRef = ref(db, 'assignments');
    const unsub = onValue(assignmentsRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data)
        .filter(([, v]) => !courseName || v.courseName === courseName)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAssignments(list);
      setLoading(false);
    }, (err) => {
      logger.error('과제 목록 로드 실패:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [courseName]);

  return { assignments, loading };
}

/**
 * useAssignment — 단일 과제 구독.
 */
export function useAssignment(assignmentId) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) { setAssignment(null); setLoading(false); return; }

    const assignmentRef = ref(db, `assignments/${assignmentId}`);
    const unsub = onValue(assignmentRef, (snap) => {
      setAssignment(snap.exists() ? { id: assignmentId, ...snap.val() } : null);
      setLoading(false);
    }, (err) => {
      logger.error('과제 로드 실패:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [assignmentId]);

  return { assignment, loading };
}

/**
 * useAssignmentActions — 과제 CRUD 액션.
 */
export function useAssignmentActions() {
  const createAssignment = useCallback(async (courseName, { title, description, roundNumber, hasJudging = true, passThreshold = 3 }) => {
    const assignmentsRef = ref(db, 'assignments');
    const newRef = push(assignmentsRef);
    await set(newRef, {
      title,
      description: description || '',
      courseName,
      roundNumber: roundNumber || null,
      hasJudging,
      passThreshold,
      status: 'open',
      createdAt: serverTimestamp(),
      closedAt: null,
      judgedAt: null,
    });
    return newRef.key;
  }, []);

  const updateAssignment = useCallback(async (assignmentId, data) => {
    await update(ref(db, `assignments/${assignmentId}`), data);
  }, []);

  const deleteAssignment = useCallback(async (assignmentId) => {
    await remove(ref(db, `assignments/${assignmentId}`));
  }, []);

  const closeAssignment = useCallback(async (assignmentId) => {
    await update(ref(db, `assignments/${assignmentId}`), {
      status: 'closed',
      closedAt: serverTimestamp(),
    });
  }, []);

  return { createAssignment, updateAssignment, deleteAssignment, closeAssignment };
}
