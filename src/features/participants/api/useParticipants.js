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

/**
 * 온라인 참여자 수만 필요한 화면용 경량 훅(예: 학생 WaitingPage).
 * 전체 useParticipants는 입장 1건마다 onValue 발화→full snapshot 머티리얼라이즈(O(N))+
 * 리렌더 → 300명 입장 폭주 시 모든 대기 학생 단말이 O(N²). 여기서는 throttle(300ms)로
 * 모아 처리하고 snap.val()도 flush 시점에만 호출, count가 바뀔 때만 setState한다.
 * @param {string} sessionId
 * @returns {number} 온라인 참여자 수
 */
export function useParticipantCount(sessionId) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!sessionId) return;
    let latestSnap = null;
    let timer = null;
    const flush = () => {
      timer = null;
      const v = latestSnap ? latestSnap.val() || {} : {};
      let c = 0;
      for (const k in v) if (v[k]?.online) c++;
      setCount((prev) => (prev === c ? prev : c));
    };
    const unsub = onValue(ref(db, `sessions/${sessionId}/participants`), (snap) => {
      latestSnap = snap; // 입장마다 발화하지만 머티리얼라이즈는 flush로 지연
      if (!timer) timer = setTimeout(flush, 300);
    });
    return () => { unsub(); if (timer) clearTimeout(timer); };
  }, [sessionId]);
  return count;
}
