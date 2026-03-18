import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

export function useConnectionStatus() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const connRef = ref(db, '.info/connected');
    const unsub = onValue(connRef, (snapshot) => {
      setConnected(snapshot.val() === true);
    });
    return () => unsub();
  }, []);

  return connected;
}
