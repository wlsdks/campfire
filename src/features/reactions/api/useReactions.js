import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';

const MAX_STORED = 50;

export function useReactions(sessionId) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    const reactionsRef = query(ref(db, `sessions/${sessionId}/reactions`), limitToLast(MAX_STORED));
    const unsub = onValue(reactionsRef, (snap) => {
      const data = snap.val();
      if (!data) { setReactions([]); return; }
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setReactions(list);
    });
    return () => unsub();
  }, [sessionId]);

  const sendReaction = useCallback(async (type) => {
    if (!sessionId) return false;
    try {
      await push(ref(db, `sessions/${sessionId}/reactions`), {
        type,
        timestamp: serverTimestamp(),
      });
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  return { reactions, sendReaction, canSend: true };
}
