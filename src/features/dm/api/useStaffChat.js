import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';

const MAX_MESSAGES = 100;
const COOLDOWN_MS = 2000;

/**
 * Real-time staff-only chat hook.
 * Subscribes to sessions/{sessionId}/staffChat.
 * @param {string} sessionId
 * @returns {{ messages, sendMessage, loading, canSend }}
 */
export function useStaffChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(true);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const chatRef = query(
      ref(db, `sessions/${sessionId}/staffChat`),
      limitToLast(MAX_MESSAGES)
    );

    const unsub = onValue(chatRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(list);
      setLoading(false);
    });

    return () => {
      unsub();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [sessionId]);

  const sendMessage = useCallback(async (text, senderName, senderType) => {
    const trimmed = text?.trim();
    if (!sessionId || !trimmed || !canSend) return false;

    try {
      await push(ref(db, `sessions/${sessionId}/staffChat`), {
        text: trimmed,
        sender: senderName || '스태프',
        senderType: senderType || 'staff',
        timestamp: serverTimestamp(),
      });

      setCanSend(false);
      cooldownRef.current = setTimeout(() => {
        setCanSend(true);
      }, COOLDOWN_MS);

      return true;
    } catch (err) {
      console.error('Staff chat send failed:', err);
      return false;
    }
  }, [sessionId, canSend]);

  return { messages, sendMessage, loading, canSend };
}
