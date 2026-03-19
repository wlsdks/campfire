import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo } from 'react';
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

  const list = useMemo(
    () => Object.entries(participants).map(([id, data]) => ({ id, ...data })),
    [participants]
  );

  const onlineList = useMemo(
    () => list.filter(p => p.online),
    [list]
  );

  const count = onlineList.length;

  return { participants, list, onlineList, count };
}
