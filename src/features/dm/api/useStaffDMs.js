import { ref, push, onValue, update, serverTimestamp, runTransaction, get } from 'firebase/database';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

/**
 * Staff-side DM hook. Subscribes to ALL DM threads.
 * @param {string} sessionId
 * @returns {{ waitingDMs, activeDMs, respondToDM, resolveDM, sendMessage }}
 */
export function useStaffDMs(sessionId) {
  const [allThreads, setAllThreads] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    const dmRef = ref(db, `sessions/${sessionId}/dm`);
    const unsub = onValue(dmRef, (snap) => {
      setAllThreads(snap.val() || {});
      setLoading(false);
    });

    return () => unsub();
  }, [sessionId]);

  const { waitingDMs, activeDMs } = useMemo(() => {
    const waiting = [];
    const active = [];
    for (const [id, thread] of Object.entries(allThreads)) {
      const msgs = thread.messages
        ? Object.entries(thread.messages)
            .map(([mid, m]) => ({ id: mid, ...m }))
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        : [];
      const item = { id, ...thread, messageList: msgs };
      if (thread.status === 'waiting') waiting.push(item);
      else if (thread.status === 'active') active.push(item);
    }
    waiting.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { waitingDMs: waiting, activeDMs: active };
  }, [allThreads]);

  /**
   * respondToDM — 담당 스태프 선점.
   * 이미 다른 스태프가 담당 중이면 no-op으로 취급하고 { alreadyClaimedBy } 반환.
   * 트랜잭션으로 race를 막아 "먼저 누른 사람이 담당"이 확정됨.
   */
  const respondToDM = useCallback(async (dmId, staffId, staffName) => {
    if (!sessionId || !dmId) return { claimed: false };
    try {
      const threadRef = ref(db, `sessions/${sessionId}/dm/${dmId}`);
      let alreadyClaimedBy = null;
      const tx = await runTransaction(threadRef, (cur) => {
        if (!cur) return cur;
        // 이미 다른 스태프가 배정돼 있으면 그대로 둠 (staffName 덮어쓰기 방지)
        if (cur.staffId && cur.staffId !== staffId) {
          alreadyClaimedBy = cur.staffName || '다른 스태프';
          return cur;
        }
        return {
          ...cur,
          staffId,
          staffName: cur.staffName || staffName,
          status: 'active',
        };
      });
      return {
        claimed: !alreadyClaimedBy,
        alreadyClaimedBy,
        dmId,
        snapshot: tx.snapshot.val(),
      };
    } catch (err) {
      logger.error('Respond to DM failed:', err);
      return { claimed: false, error: err };
    }
  }, [sessionId]);

  const resolveDM = useCallback(async (dmId) => {
    if (!sessionId || !dmId) return;
    try {
      await update(ref(db, `sessions/${sessionId}/dm/${dmId}`), {
        status: 'resolved',
      });
    } catch (err) {
      logger.error('Resolve DM failed:', err);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (dmId, text, senderName, senderType) => {
    if (!sessionId || !dmId || !text?.trim()) return false;
    try {
      await push(ref(db, `sessions/${sessionId}/dm/${dmId}/messages`), {
        text: text.trim(),
        sender: senderName || '스태프',
        senderType: senderType || 'staff',
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      logger.error('DM send failed:', err);
      return false;
    }
  }, [sessionId]);

  /**
   * ensureDMForStudent — 학생별 단일 active/waiting DM 보장.
   * sessions/{sid}/dmByStudent/{studentId} 포인터를 runTransaction으로 선점 →
   * 여러 스태프가 동시에 같은 학생 DM을 열어도 단 하나만 생성.
   * resolved 이력 DM은 무시하고 새로 시작한다.
   *
   * 반환: { dmId, existed } — existed=true면 기존 DM 재사용
   */
  const ensureDMForStudent = useCallback(async ({ studentId, studentName, staffId, staffName, firstMessage }) => {
    if (!sessionId || !studentId) throw new Error('세션 또는 학생 ID 누락');
    const pointerRef = ref(db, `sessions/${sessionId}/dmByStudent/${studentId}`);

    // 1) 포인터 우선 확인 (fast path)
    const ptrSnap = await get(pointerRef);
    const ptrDmId = ptrSnap.val();
    if (ptrDmId) {
      const threadSnap = await get(ref(db, `sessions/${sessionId}/dm/${ptrDmId}`));
      if (threadSnap.exists() && threadSnap.val()?.status !== 'resolved') {
        return { dmId: ptrDmId, existed: true };
      }
      // 포인터는 있는데 DM 없음 or resolved → rollover 필요 (아래 신규 생성 분기로)
    }

    // 2) 레거시 호환 — 포인터 없이 기존에 생성된 DM 흡수.
    //    같은 studentId의 active/waiting 스레드가 이미 있으면 거기로 포인터 박고 재사용.
    const legacyEntry = Object.entries(allThreads).find(
      ([, t]) => t.studentId === studentId && t.status !== 'resolved'
    );
    if (legacyEntry) {
      const [legacyId] = legacyEntry;
      const tx = await runTransaction(pointerRef, (cur) => (cur ? cur : legacyId));
      const committedId = tx.snapshot.val();
      return { dmId: committedId || legacyId, existed: true };
    }

    // 3) 신규 생성 — 경합 안전 버전.
    //    트랜잭션 콜백 안에서는 push().key 호출하지 않는다 (재시도마다 ID 낭비).
    //    대신 외부에서 한 번 생성 후 콜백에서는 반영만.
    const newCandidateId = push(ref(db, `sessions/${sessionId}/dm`)).key;
    let wonRace = false;

    const tx = await runTransaction(pointerRef, (cur) => {
      if (cur) return cur;
      wonRace = true;
      return newCandidateId;
    });

    const committedId = tx.snapshot.val();
    if (!committedId) throw new Error('DM 포인터 확보 실패');

    // 4) 레이스 패자: 우리는 포인터를 못 박았고 다른 작성자가 이겼음.
    //    그 작성자가 DM 노드를 만들 때까지 짧게 폴링 (최대 1.5s).
    //    만약 타임아웃되면 그 작성자가 죽었다고 판단하고 우리가 대신 생성.
    if (!wonRace) {
      for (let i = 0; i < 15; i++) {
        const s = await get(ref(db, `sessions/${sessionId}/dm/${committedId}`));
        if (s.exists()) return { dmId: committedId, existed: true };
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    // 5) 우리가 승자거나 타임아웃 rollover.
    //    포인터가 가리키는 ID로 DM 노드 생성 (승자 ID == committedId, 또는 우리가 다시 선점한 ID).
    let effectiveId = committedId;
    if (!wonRace) {
      // 타임아웃 rollover: 새 ID 발급하고 포인터 덮어쓰기
      effectiveId = push(ref(db, `sessions/${sessionId}/dm`)).key;
      await runTransaction(pointerRef, () => effectiveId);
    }

    await update(ref(db, `sessions/${sessionId}/dm/${effectiveId}`), {
      studentId,
      studentName: studentName || '학생',
      staffId: staffId || null,
      staffName: staffName || null,
      status: staffId ? 'active' : 'waiting',
      createdAt: serverTimestamp(),
    });
    if (firstMessage) {
      await push(ref(db, `sessions/${sessionId}/dm/${effectiveId}/messages`), {
        ...firstMessage,
        timestamp: serverTimestamp(),
      });
    }

    return { dmId: effectiveId, existed: false };
  }, [sessionId, allThreads]);

  return { waitingDMs, activeDMs, respondToDM, resolveDM, sendMessage, ensureDMForStudent, loading };
}
