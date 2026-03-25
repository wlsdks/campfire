import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

const MAX_MESSAGES = 100;
const COOLDOWN_MS = 2000;

// Stable empty return for non-staff callers (avoids Firebase subscription)
const NOOP_CHAT = {
  messages: [],
  sendMessage: async () => false,
  loading: false,
  canSend: false,
};

/**
 * Real-time staff-only chat hook.
 * Pass enabled=false for non-staff users to skip Firebase subscription entirely.
 * @param {string} sessionId
 * @param {{ enabled?: boolean }} options
 * @returns {{ messages, sendMessage, loading, canSend }}
 */
export function useStaffChat(sessionId, { enabled = true } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(true);
  // Use ref to track canSend in sendMessage without adding it to deps
  const canSendRef = useRef(true);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !enabled) return;

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
  }, [sessionId, enabled]);

  const sendMessage = useCallback(async (text, senderName, senderType) => {
    const trimmed = text?.trim();
    if (!sessionId || !trimmed || !canSendRef.current) return false;

    try {
      await push(ref(db, `sessions/${sessionId}/staffChat`), {
        text: trimmed,
        sender: senderName || '스태프',
        senderType: senderType || 'staff',
        timestamp: serverTimestamp(),
      });

      canSendRef.current = false;
      setCanSend(false);
      cooldownRef.current = setTimeout(() => {
        canSendRef.current = true;
        setCanSend(true);
      }, COOLDOWN_MS);

      return true;
    } catch (err) {
      logger.error('Staff chat send failed:', err);
      return false;
    }
  }, [sessionId]);

  if (!enabled) return NOOP_CHAT;

  return { messages, sendMessage, loading, canSend };
}
