import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';

const MAX_STORED = 50;

// subscribe=false: 전송만 하고 reactions 목록은 구독하지 않음(ReactionBar 등).
// 300명 전원이 전송 컴포넌트에서 불필요한 reactions onValue를 들지 않게 함.
export function useReactions(sessionId, { subscribe = true } = {}) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!sessionId || !subscribe) return;
    const reactionsRef = query(ref(db, `sessions/${sessionId}/reactions`), limitToLast(MAX_STORED));
    const unsub = onValue(reactionsRef, (snap) => {
      const data = snap.val();
      if (!data) { setReactions([]); return; }
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setReactions(list);
    });
    return () => unsub();
  }, [sessionId, subscribe]);

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
