import { useState, useEffect, useMemo, useCallback } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Listens to the admins node in Firebase and provides
 * pending approval management for master admins.
 *
 * @returns {{ pendingAdmins: Array, pendingCount: number, approveAdmin: Function, rejectAdmin: Function, loading: boolean }}
 */
export function useAdminApprovals() {
  const [admins, setAdmins] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminsRef = ref(db, 'admins');
    const unsub = onValue(adminsRef, (snap) => {
      setAdmins(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const pendingAdmins = useMemo(() => {
    if (!admins) return [];
    return Object.entries(admins)
      .filter(([, admin]) => admin.approved === false)
      .map(([uid, admin]) => ({ uid, ...admin }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [admins]);

  const pendingCount = pendingAdmins.length;

  const approveAdmin = useCallback(async (uid) => {
    await update(ref(db, `admins/${uid}`), { approved: true });
  }, []);

  const rejectAdmin = useCallback(async (uid) => {
    await remove(ref(db, `admins/${uid}`));
  }, []);

  return { pendingAdmins, pendingCount, approveAdmin, rejectAdmin, loading };
}
