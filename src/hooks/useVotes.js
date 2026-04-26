import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

// P2-6: 적응형 debounce — 클래스 규모에 따라 자동 조정.
// 소수 인원/시연: 즉시 반영해 즉각 피드백 (Doherty Threshold).
// 다수 인원: throttle로 render 폭주 방지 (300명 동시 투표 대응).
function adaptiveDebounce(count) {
  if (count <= 10) return 0;     // 소규모: 즉시
  if (count <= 50) return 50;    // 중규모: 약한 throttle
  return 150;                     // 대규모: 안전 throttle
}

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
      // 첫 로드는 항상 즉시
      if (initialRef.current) {
        initialRef.current = false;
        setVotes(val);
        return;
      }
      const debounceMs = adaptiveDebounce(Object.keys(val).length);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceMs === 0) {
        setVotes(val);
      } else {
        timerRef.current = setTimeout(() => setVotes(val), debounceMs);
      }
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
