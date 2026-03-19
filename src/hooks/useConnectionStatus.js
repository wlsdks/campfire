import { ref, onValue } from 'firebase/database';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';

/**
 * Tracks Firebase realtime connection status via `.info/connected`.
 *
 * @returns {{ connected: boolean, showBanner: 'offline' | 'reconnected' | null }}
 *   - connected: current connection state
 *   - showBanner: 'offline' while disconnected, 'reconnected' briefly after
 *     regaining connection, null when idle
 */
export function useConnectionStatus() {
  const [connected, setConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(null);
  const wasDisconnectedRef = useRef(false);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const connRef = ref(db, '.info/connected');
    const unsub = onValue(connRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);

      if (!isConnected) {
        // Clear any pending reconnect dismiss timer
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        wasDisconnectedRef.current = true;
        setShowBanner('offline');
      } else if (wasDisconnectedRef.current) {
        // Just reconnected — show brief success banner
        wasDisconnectedRef.current = false;
        setShowBanner('reconnected');
        reconnectTimerRef.current = setTimeout(() => {
          setShowBanner(null);
          reconnectTimerRef.current = null;
        }, 2000);
      }
    });

    return () => {
      unsub();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return { connected, showBanner };
}
