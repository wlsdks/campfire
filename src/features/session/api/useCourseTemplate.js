import { useState, useEffect, useCallback } from 'react';
import { ref, get, set, remove, update, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Hook to manage course templates in Firebase.
 *
 * @param {string|null} courseId - The course template ID to load
 * @returns {{ template: Object|null, loading: boolean, save: Function, addQuestion: Function, updateQuestion: Function, deleteQuestion: Function, duplicateQuestion: Function }}
 */
export function useCourseTemplate(courseId) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTemplate = useCallback(async () => {
    if (!courseId) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    try {
      const snap = await get(ref(db, `courseTemplates/${courseId}`));
      setTemplate(snap.val());
    } catch {
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const save = useCallback(async (name, questions) => {
    if (!courseId) return;
    try {
      await set(ref(db, `courseTemplates/${courseId}`), {
        name,
        createdAt: serverTimestamp(),
        questions: questions || {},
      });
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  const addQuestion = useCallback(async (qId, questionData) => {
    if (!courseId) return;
    try {
      await set(ref(db, `courseTemplates/${courseId}/questions/${qId}`), questionData);
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  const updateQuestion = useCallback(async (qId, questionData) => {
    if (!courseId) return;
    try {
      await set(ref(db, `courseTemplates/${courseId}/questions/${qId}`), questionData);
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  const deleteQuestion = useCallback(async (qId) => {
    if (!courseId) return;
    try {
      await remove(ref(db, `courseTemplates/${courseId}/questions/${qId}`));
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  const duplicateQuestion = useCallback(async (qId, newId, newData) => {
    if (!courseId) return;
    try {
      await set(ref(db, `courseTemplates/${courseId}/questions/${newId}`), newData);
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  const swapQuestionOrder = useCallback(async (qIdA, orderA, qIdB, orderB) => {
    if (!courseId) return;
    try {
      await update(ref(db, `courseTemplates/${courseId}`), {
        [`questions/${qIdA}/order`]: orderB,
        [`questions/${qIdB}/order`]: orderA,
      });
      await fetchTemplate();
    } catch {
      // Silently fail
    }
  }, [courseId, fetchTemplate]);

  return { template, loading, save, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion, swapQuestionOrder, refresh: fetchTemplate };
}

/**
 * Fetches template questions for a given courseId. One-time read utility.
 *
 * @param {string} courseId
 * @returns {Promise<Object|null>} questions object or null
 */
export async function getCourseTemplateQuestions(courseId) {
  if (!courseId) return null;
  try {
    const snap = await get(ref(db, `courseTemplates/${courseId}/questions`));
    return snap.val();
  } catch {
    return null;
  }
}
