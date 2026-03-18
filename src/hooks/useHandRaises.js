import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

export function useHandRaises(sessionId) {
  const [handRaises, setHandRaises] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const handRaisesRef = ref(db, `sessions/${sessionId}/handRaises`);
    const unsub = onValue(handRaisesRef, (snapshot) => {
      setHandRaises(snapshot.val() || {});
    });
    return () => unsub();
  }, [sessionId]);

  const raisedList = Object.entries(handRaises)
    .filter(([, data]) => data.raised)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (a.raisedAt || 0) - (b.raisedAt || 0));

  return { handRaises, raisedList, count: raisedList.length };
}
