import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

const COOLDOWN_MS = 3000;
const MAX_STORED = 50;

export function useReactions(sessionId) {
  const [reactions, setReactions] = useState([]);
  const lastSentRef = useRef(0);

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
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) return false;
    lastSentRef.current = now;
    await push(ref(db, `sessions/${sessionId}/reactions`), {
      type,
      timestamp: serverTimestamp(),
    });
    return true;
  }, [sessionId]);

  const canSend = Date.now() - lastSentRef.current >= COOLDOWN_MS;

  return { reactions, sendReaction, canSend };
}
