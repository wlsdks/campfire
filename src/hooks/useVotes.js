import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

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

  const voteList = Object.entries(votes).map(([id, data]) => ({ id, ...data }));
  const totalVotes = voteList.length;

  function countByValue(value) {
    return voteList.filter(v => v.value === value).length;
  }

  function tally() {
    const counts = {};
    voteList.forEach(v => {
      counts[v.value] = (counts[v.value] || 0) + 1;
    });
    return counts;
  }

  return { votes, voteList, totalVotes, countByValue, tally };
}
