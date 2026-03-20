import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

/**
 * Student-side hook to detect speed quiz mode.
 * Read-only — just watches the speedQuiz state from Firebase.
 */
export function useSpeedQuizStudent(sessionId) {
  const [speedQuiz, setSpeedQuiz] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const speedRef = ref(db, `sessions/${sessionId}/speedQuiz`);
    const unsub = onValue(speedRef, (snap) => {
      setSpeedQuiz(snap.val());
    });
    return () => unsub();
  }, [sessionId]);

  return {
    isSpeedQuiz: speedQuiz?.active === true,
    totalQuestions: speedQuiz?.totalQuestions || 0,
  };
}
