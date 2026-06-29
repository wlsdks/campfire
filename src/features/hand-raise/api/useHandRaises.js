import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';

/**
 * 학생 전용 경량 훅 — 본인 손들기 상태(boolean)만 구독.
 * 전체 handRaises 컬렉션(300명) 구독 대신 sessions/{id}/handRaises/{pid}만 onValue.
 * 강사/스태프(전체 목록 필요)는 useHandRaises 사용.
 */
export function useMyHandRaise(sessionId) {
  const [raised, setRaised] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const pid = getParticipantId();
    if (!pid) return;
    const myRef = ref(db, `sessions/${sessionId}/handRaises/${pid}`);
    const unsub = onValue(myRef, (snap) => setRaised(snap.val()?.raised === true));
    return () => unsub();
  }, [sessionId]);

  return { raised };
}

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

  const raisedList = useMemo(
    () =>
      Object.entries(handRaises)
        .filter(([, data]) => data.raised)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (a.raisedAt || 0) - (b.raisedAt || 0)),
    [handRaises]
  );

  return { handRaises, raisedList, count: raisedList.length };
}
