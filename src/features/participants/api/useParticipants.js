import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

export function useParticipants(sessionId) {
  const [participants, setParticipants] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const participantsRef = ref(db, `sessions/${sessionId}/participants`);
    const unsub = onValue(participantsRef, (snapshot) => {
      setParticipants(snapshot.val() || {});
    });
    return () => unsub();
  }, [sessionId]);

  const list = Object.entries(participants).map(([id, data]) => ({ id, ...data }));
  const onlineList = list.filter(p => p.online);

  return { participants, list, onlineList, count: onlineList.length };
}
