import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo } from 'react';
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

  return { scores, leaderboard, totalTickets };
}
