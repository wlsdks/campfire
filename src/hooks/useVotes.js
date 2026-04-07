import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

const DEBOUNCE_MS = 150;

export function useVotes(sessionId, questionId) {
  const [votes, setVotes] = useState({});
  const timerRef = useRef(null);
  const initialRef = useRef(true);

  useEffect(() => {
    if (!sessionId || !questionId) return;
    initialRef.current = true;
    const votesRef = ref(db, `sessions/${sessionId}/questions/${questionId}/votes`);
    const unsub = onValue(votesRef, (snapshot) => {
      const val = snapshot.val() || {};
      // 첫 로드는 즉시, 이후 업데이트만 디바운스 (300명 동시 투표 대응)
      if (initialRef.current) {
        initialRef.current = false;
        setVotes(val);
        return;
      }
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
