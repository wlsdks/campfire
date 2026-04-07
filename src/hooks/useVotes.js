import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

const DEBOUNCE_MS = 150;

export function useVotes(sessionId, questionId) {
  const [votes, setVotes] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const votesRef = ref(db, `sessions/${sessionId}/questions/${questionId}/votes`);
    const unsub = onValue(votesRef, (snapshot) => {
      const val = snapshot.val() || {};
      // Debounce rapid vote updates (300 users voting simultaneously)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVotes(val), DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId, questionId]);

  const voteList = useMemo(
    () => Object.entries(votes).map(([id, data]) => ({ id, ...data })),
    [votes]
  );

  const totalVotes = voteList.length;

  /** Pre-computed tally: { value: count } */
  const tallied = useMemo(() => {
    const counts = {};
    voteList.forEach(v => {
      counts[v.value] = (counts[v.value] || 0) + 1;
    });
    return counts;
  }, [voteList]);

  const countByValue = useCallback(
    (value) => tallied[value] || 0,
    [tallied]
  );

  /** Returns the pre-computed tally object (stable ref). */
  const tally = useCallback(() => tallied, [tallied]);

  return { votes, voteList, totalVotes, countByValue, tally };
}
