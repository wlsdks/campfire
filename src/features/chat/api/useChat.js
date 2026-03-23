import { ref, push, onValue, serverTimestamp, query, limitToLast } from 'firebase/database';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

const MAX_MESSAGES = 100;
const COOLDOWN_MS = 2000;

/**
 * Real-time chat hook for a session.
 * Subscribes to the latest 100 messages and provides a rate-limited sendMessage action.
 * @param {string} sessionId
 * @returns {{ messages: Array, sendMessage: (text: string, sender: string, senderType: string) => Promise<boolean>, loading: boolean, canSend: boolean }}
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(true);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const chatRef = query(
      ref(db, `sessions/${sessionId}/chat`),
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

  const sendMessage = useCallback(async (text, sender, senderType) => {
    const trimmed = text?.trim();
    if (!sessionId || !trimmed || !canSend) return false;

    try {
      await push(ref(db, `sessions/${sessionId}/chat`), {
        text: trimmed,
        sender: sender || '익명',
        senderType: senderType || 'student',
        timestamp: serverTimestamp(),
      });

      // Start cooldown
      setCanSend(false);
      cooldownRef.current = setTimeout(() => {
        setCanSend(true);
      }, COOLDOWN_MS);

      return true;
    } catch (err) {
      logger.error('Send message failed:', err);
      return false;
    }
  }, [sessionId, canSend]);

  return { messages, sendMessage, loading, canSend };
}
