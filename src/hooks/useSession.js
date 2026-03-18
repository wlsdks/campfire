import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsub = onValue(sessionRef, (snapshot) => {
      setSession(snapshot.val());
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId]);

  return { session, loading };
}
