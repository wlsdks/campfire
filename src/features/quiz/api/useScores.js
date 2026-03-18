import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
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

  const addScore = useCallback(async (participantId, nickname, points) => {
    if (!sessionId) return;
    const currentScore = scores[participantId]?.total || 0;
    await set(ref(db, `sessions/${sessionId}/scores/${participantId}`), {
      nickname,
      total: currentScore + points,
      lastPoints: points,
      updatedAt: serverTimestamp(),
    });
  }, [sessionId, scores]);

  const calculatePoints = useCallback((isCorrect, elapsedMs, durationMs) => {
    if (!isCorrect) return 0;
    const base = 100;
    const speedRatio = Math.max(0, 1 - (elapsedMs / durationMs));
    const speedBonus = Math.round(speedRatio * 50);
    return base + speedBonus;
  }, []);

  const leaderboard = Object.entries(scores)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b.total || 0) - (a.total || 0));

  return { scores, leaderboard, addScore, calculatePoints };
}
