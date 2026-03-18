import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';

export function useTimer(sessionId) {
  const [timerData, setTimerData] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const timerRef = ref(db, `sessions/${sessionId}/timer`);
    const unsub = onValue(timerRef, (snap) => {
      setTimerData(snap.val());
    });
    return () => unsub();
  }, [sessionId]);

  const startTimer = useCallback(async (durationSeconds) => {
    if (!sessionId) return;
    const endTime = Date.now() + durationSeconds * 1000;
    await update(ref(db, `sessions/${sessionId}/timer`), {
      endTime,
      duration: durationSeconds,
      running: true,
      startedAt: serverTimestamp(),
    });
  }, [sessionId]);

  const stopTimer = useCallback(async () => {
    if (!sessionId) return;
    await update(ref(db, `sessions/${sessionId}/timer`), {
      endTime: null,
      running: false,
      duration: 0,
    });
  }, [sessionId]);

  return {
    isRunning: timerData?.running === true,
    endTime: timerData?.endTime || null,
    duration: timerData?.duration || 0,
    startTimer,
    stopTimer,
  };
}
