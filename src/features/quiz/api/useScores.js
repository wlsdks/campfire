import { ref, onValue, set } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';

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
