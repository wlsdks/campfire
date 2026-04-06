import { ref, push, onValue, update, serverTimestamp } from 'firebase/database';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
      const dmRef = ref(db, `sessions/${sessionId}/dm`);
      const newThread = await push(dmRef, {
        studentId: participantId,
        studentName: studentName || '익명',
        staffId: null,
        staffName: null,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
      // Add first message
      await push(ref(db, `sessions/${sessionId}/dm/${newThread.key}/messages`), {
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
  }, [sessionId, participantId]);

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

  return { activeDM, allActiveDMs, sendMessage, requestHelp };
}

/**
 * Staff-side DM hook. Subscribes to ALL DM threads.
 * @param {string} sessionId
 * @returns {{ waitingDMs, activeDMs, respondToDM, resolveDM, sendMessage }}
 */
export function useStaffDMs(sessionId) {
  const [allThreads, setAllThreads] = useState({});

  useEffect(() => {
    if (!sessionId) return;

    const dmRef = ref(db, `sessions/${sessionId}/dm`);
    const unsub = onValue(dmRef, (snap) => {
      setAllThreads(snap.val() || {});
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

  const respondToDM = useCallback(async (dmId, staffId, staffName) => {
    if (!sessionId || !dmId) return;
    try {
      await update(ref(db, `sessions/${sessionId}/dm/${dmId}`), {
        staffId,
        staffName,
        status: 'active',
      });
    } catch (err) {
      logger.error('Respond to DM failed:', err);
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

  return { waitingDMs, activeDMs, respondToDM, resolveDM, sendMessage };
}
