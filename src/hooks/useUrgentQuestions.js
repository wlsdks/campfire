import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

export function useUrgentQuestions(sessionId) {
  const [questions, setQuestions] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const questionsRef = ref(db, `sessions/${sessionId}/urgentQuestions`);
    const unsub = onValue(questionsRef, (snapshot) => {
      setQuestions(snapshot.val() || {});
    });
    return () => unsub();
  }, [sessionId]);

  const questionList = Object.entries(questions)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const unreadCount = questionList.filter(q => !q.read).length;

  return { questions, questionList, unreadCount };
}
