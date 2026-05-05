import { ref, onValue, update } from 'firebase/database';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

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
