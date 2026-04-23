import { ref, push, onValue, update, serverTimestamp, runTransaction, get } from 'firebase/database';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

/**
 * Student-side DM hook. Subscribes to DM threads for this student.
 * @param {string} sessionId
 * @param {string} participantId
 * @returns {{ activeDM, sendMessage, requestHelp }}
 */
export function useStudentDM(sessionId, participantId) {
  const [threads, setThreads] = useState({});

  useEffect(() => {
    if (!sessionId || !participantId) return;

    const dmRef = ref(db, `sessions/${sessionId}/dm`);
    const unsub = onValue(dmRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setThreads({});
        return;
      }
      // Filter threads for this student
      const filtered = {};
      for (const [id, thread] of Object.entries(data)) {
        if (thread.studentId === participantId) {
          filtered[id] = thread;
        }
      }
      setThreads(filtered);
    });

    return () => unsub();
  }, [sessionId, participantId]);

  // All DM threads (including resolved) with messages
  const allActiveDMs = useMemo(() => {
    return Object.entries(threads)
      .map(([id, thread]) => {
        const msgs = thread.messages
          ? Object.entries(thread.messages)
              .map(([mid, m]) => ({ id: mid, ...m }))
              .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
          : [];
        return { id, ...thread, messageList: msgs };
      })
      .sort((a, b) => {
        // resolved를 맨 아래로
        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
        if (a.status !== 'resolved' && b.status === 'resolved') return -1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [threads]);

  // First active DM (backward compat)
  const activeDM = allActiveDMs[0] || null;

  const requestHelp = useCallback(async (text, studentName) => {
    if (!sessionId || !participantId || !text?.trim()) return false;
    try {
      const pointerRef = ref(db, `sessions/${sessionId}/dmByStudent/${participantId}`);

      // 1) 포인터 fast path
      let targetDmId = null;
      const ptrSnap = await get(pointerRef);
      const ptrDmId = ptrSnap.val();
      if (ptrDmId) {
        const threadSnap = await get(ref(db, `sessions/${sessionId}/dm/${ptrDmId}`));
        if (threadSnap.exists() && threadSnap.val()?.status !== 'resolved') {
          targetDmId = ptrDmId;
        }
      }

      // 2) 레거시: studentId 일치하는 기존 DM 흡수
      if (!targetDmId) {
        const legacyEntry = Object.entries(threads).find(
          ([, t]) => t.status !== 'resolved'
        );
        if (legacyEntry) {
          const [legacyId] = legacyEntry;
          const tx = await runTransaction(pointerRef, (cur) => (cur ? cur : legacyId));
          targetDmId = tx.snapshot.val() || legacyId;
        }
      }

      // 3) 신규 생성 — 경합 안전
      if (!targetDmId) {
        const newCandidateId = push(ref(db, `sessions/${sessionId}/dm`)).key;
        let wonRace = false;
        const tx = await runTransaction(pointerRef, (cur) => {
          if (cur) return cur;
          wonRace = true;
          return newCandidateId;
        });
        const committedId = tx.snapshot.val();
        if (!committedId) throw new Error('DM 포인터 확보 실패');

        if (!wonRace) {
          // 패자: 승자의 DM 생성 대기 (최대 1.5s)
          let found = false;
          for (let i = 0; i < 15; i++) {
            const s = await get(ref(db, `sessions/${sessionId}/dm/${committedId}`));
            if (s.exists()) { found = true; targetDmId = committedId; break; }
            await new Promise((r) => setTimeout(r, 100));
          }
          if (!found) {
            targetDmId = push(ref(db, `sessions/${sessionId}/dm`)).key;
            await runTransaction(pointerRef, () => targetDmId);
          }
        } else {
          targetDmId = committedId;
        }

        // 신규 노드 생성
        await update(ref(db, `sessions/${sessionId}/dm/${targetDmId}`), {
          studentId: participantId,
          studentName: studentName || '익명',
          staffId: null,
          staffName: null,
          status: 'waiting',
          createdAt: serverTimestamp(),
        });
      }

      await push(ref(db, `sessions/${sessionId}/dm/${targetDmId}/messages`), {
        text: text.trim(),
        sender: studentName || '익명',
        senderType: 'student',
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      logger.error('Request help failed:', err);
      return false;
    }
  }, [sessionId, participantId, threads]);

  const sendMessage = useCallback(async (text, senderName) => {
    if (!activeDM?.id || !text?.trim()) return false;
    try {
      await push(ref(db, `sessions/${sessionId}/dm/${activeDM.id}/messages`), {
        text: text.trim(),
        sender: senderName || '익명',
        senderType: 'student',
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      logger.error('DM send failed:', err);
      return false;
    }
  }, [sessionId, activeDM?.id]);

  // Track newly resolved DMs — fires once per resolution
  const [newlyResolved, setNewlyResolved] = useState(null);
  const prevStatusRef = useRef({});

  useEffect(() => {
    const prevStatuses = prevStatusRef.current;
    for (const [id, thread] of Object.entries(threads)) {
      if (thread.status === 'resolved' && prevStatuses[id] && prevStatuses[id] !== 'resolved') {
        setNewlyResolved({ id, staffName: thread.staffName || '스태프' });
        break;
      }
    }
    // Update prev statuses
    const next = {};
    for (const [id, thread] of Object.entries(threads)) {
      next[id] = thread.status;
    }
    prevStatusRef.current = next;
  }, [threads]);

  const clearNewlyResolved = useCallback(() => setNewlyResolved(null), []);

  // Track new staff messages — "스태프가 답변을 시작했어요" 토스트용.
  // 초기 로드는 무시 (초기 구독 시 이미 있던 메시지로 토스트 뜨지 않게).
  const [newStaffMessage, setNewStaffMessage] = useState(null);
  const prevStaffCountRef = useRef(null);

  useEffect(() => {
    const next = {};
    for (const [id, thread] of Object.entries(threads)) {
      const staffMsgCount = thread.messages
        ? Object.values(thread.messages).filter((m) => m.senderType === 'staff' || m.senderType === 'instructor').length
        : 0;
      next[id] = { count: staffMsgCount, staffName: thread.staffName || '스태프' };
    }

    if (prevStaffCountRef.current !== null) {
      // 최신 staff 메시지가 추가된 스레드 찾기
      for (const [id, cur] of Object.entries(next)) {
        const prev = prevStaffCountRef.current[id]?.count ?? 0;
        if (cur.count > prev) {
          setNewStaffMessage({ id, staffName: cur.staffName, isFirst: prev === 0 });
          break;
        }
      }
    }
    prevStaffCountRef.current = next;
  }, [threads]);

  const clearNewStaffMessage = useCallback(() => setNewStaffMessage(null), []);

  return {
    activeDM,
    allActiveDMs,
    sendMessage,
    requestHelp,
    newlyResolved,
    clearNewlyResolved,
    newStaffMessage,
    clearNewStaffMessage,
  };
}

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

/**
 * useDMTyping — 스태프가 입력창에 타이핑 중임을 실시간 공유.
 * Firebase: sessions/{sid}/dm/{dmId}/typing/{userId} = { name, at }
 *
 * 반환:
 * - notifyTyping(): 현재 사용자가 타이핑 중임을 서버에 갱신 (throttle 1s)
 * - activeTypers: 최근 3초 이내 갱신된 다른 사용자 목록 [{ id, name }]
 */
export function useDMTyping(sessionId, dmId, { userId, userName } = {}) {
  const [typingMap, setTypingMap] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const lastWriteRef = useRef(0);

  // activeTypers 계산을 pure하게 — Date.now()를 state로 끌어올려 비결정성 제거
  const activeTypers = useMemo(() => {
    const cutoff = now - 3000;
    return Object.entries(typingMap)
      .filter(([id, v]) => id !== userId && typeof v?.at === 'number' && v.at > cutoff)
      .map(([id, v]) => ({ id, name: v.name || '스태프' }));
  }, [typingMap, userId, now]);

  useEffect(() => {
    if (!sessionId || !dmId) { setTypingMap({}); return; }
    const tRef = ref(db, `sessions/${sessionId}/dm/${dmId}/typing`);
    const unsub = onValue(tRef, (snap) => setTypingMap(snap.val() || {}));
    // 2초마다 now 갱신해 활성 타이퍼 자동 만료 반영
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => { unsub(); clearInterval(interval); };
  }, [sessionId, dmId]);

  const notifyTyping = useCallback(async () => {
    if (!sessionId || !dmId || !userId) return;
    const now = Date.now();
    if (now - lastWriteRef.current < 1500) return; // throttle 1.5s
    lastWriteRef.current = now;
    try {
      await update(ref(db, `sessions/${sessionId}/dm/${dmId}/typing/${userId}`), {
        name: userName || '스태프',
        at: now,
      });
    } catch (err) {
      // typing signal은 best-effort — 실패해도 사용자 경험엔 영향 없음
      logger.warn('Typing signal failed:', err?.message || err);
    }
  }, [sessionId, dmId, userId, userName]);

  const clearTyping = useCallback(async () => {
    if (!sessionId || !dmId || !userId) return;
    try {
      await update(ref(db, `sessions/${sessionId}/dm/${dmId}/typing/${userId}`), null);
    } catch { /* ignore */ }
  }, [sessionId, dmId, userId]);

  return { activeTypers, notifyTyping, clearTyping };
}
