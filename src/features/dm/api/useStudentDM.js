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

    // 본인 DM만 구독 — 전체 /dm 트리를 받아 클라에서 필터링하면 (1) 타 학생의 1:1 상담 메시지
    // 본문까지 모든 학생 단말로 내려가는 사생활 노출, (2) 불필요한 전체 다운로드가 발생한다.
    // dmByStudent/{pid} 포인터(직접 key) → 본인 스레드(직접 key)만 구독해 둘 다 해소(쿼리/인덱스 불필요).
    const pointerRef = ref(db, `sessions/${sessionId}/dmByStudent/${participantId}`);
    let threadUnsub = null;

    const ptrUnsub = onValue(pointerRef, (ptrSnap) => {
      const dmId = ptrSnap.val();
      if (threadUnsub) { threadUnsub(); threadUnsub = null; }
      if (!dmId) { setThreads({}); return; }
      const threadRef = ref(db, `sessions/${sessionId}/dm/${dmId}`);
      threadUnsub = onValue(threadRef, (tSnap) => {
        const t = tSnap.val();
        setThreads(t ? { [dmId]: t } : {});
      });
    });

    return () => { ptrUnsub(); if (threadUnsub) threadUnsub(); };
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
