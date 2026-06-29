import { ref, onValue, set } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';

/**
 * 학생 전용 경량 훅 — 본인 점수 노드만 구독.
 * 전체 scores 컬렉션(300명) 구독 대신 sessions/{id}/scores/{pid}만 onValue.
 * 300명 동시접속 fan-out 방지 — 전체 leaderboard가 필요한 곳만 useScores 사용.
 */
export function useMyScore(sessionId) {
  const [myScore, setMyScore] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const pid = getParticipantId();
    if (!pid) return;
    const myRef = ref(db, `sessions/${sessionId}/scores/${pid}`);
    const unsub = onValue(myRef, (snap) => setMyScore(snap.val()));
    return () => unsub();
  }, [sessionId]);

  return { myScore };
}

export function useScores(sessionId) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const scoresRef = ref(db, `sessions/${sessionId}/scores`);
    const unsub = onValue(scoresRef, (snap) => {
      setScores(snap.val() || {});
    });
    return () => unsub();
  }, [sessionId]);

  const leaderboard = useMemo(
    () => Object.entries(scores)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.total || 0) - (a.total || 0) || (a.nickname || '').localeCompare(b.nickname || '')),
    [scores]
  );

  const totalTickets = useMemo(
    () => leaderboard.reduce((sum, entry) => sum + (entry.tickets || 0), 0),
    [leaderboard]
  );

  const resetScores = useCallback(async () => {
    if (!sessionId) return;
    // Reset all scores to 0 but keep nicknames
    const resetData = {};
    Object.entries(scores).forEach(([id, data]) => {
      resetData[id] = { nickname: data.nickname, total: 0, tickets: 0 };
    });
    await set(ref(db, `sessions/${sessionId}/scores`), resetData);
  }, [sessionId, scores]);

  return { scores, leaderboard, totalTickets, resetScores };
}
