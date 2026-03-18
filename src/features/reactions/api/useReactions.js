import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

const COOLDOWN_MS = 3000;
const MAX_STORED = 50;

export function useReactions(sessionId) {
  const [reactions, setReactions] = useState([]);
  const [canSend, setCanSend] = useState(true);
  const canSendRef = useRef(true);
  const cooldownTimer = useRef(null);

  useEffect(() => {
    canSendRef.current = canSend;
  }, [canSend]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

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
    if (!sessionId || !canSendRef.current) return false;
    setCanSend(false);
    cooldownTimer.current = setTimeout(() => setCanSend(true), COOLDOWN_MS);
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

  return { reactions, sendReaction, canSend };
}
