import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';

export function useVotes(sessionId, questionId) {
  const [votes, setVotes] = useState({});

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const votesRef = ref(db, `sessions/${sessionId}/questions/${questionId}/votes`);
    const unsub = onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() || {});
    });
    return () => unsub();
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
