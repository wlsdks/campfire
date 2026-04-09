import { useState, useEffect, useCallback } from 'react';
import { ref, get, update, remove, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Hook for managing staff assignment to a course.
 * - staffList: real-time list of assigned staff
 * - searchStaff(query): search registered staff users
 * - assignStaff / removeStaff: multi-path atomic updates
 *
 * @param {string} courseId
 * @returns {{ staffList, loading, searchStaff, searchResults, searchLoading, assignStaff, removeStaff }}
 */
export function useStaffAssignment(courseId) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Real-time listener for assigned staff
  useEffect(() => {
    if (!courseId) { setStaffList([]); setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(ref(db, `courses/${courseId}/staff`), (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([uid, data]) => ({
        uid,
        displayName: data.displayName,
        assignedAt: data.assignedAt,
      }));
      list.sort((a, b) => (b.assignedAt || 0) - (a.assignedAt || 0));
      setStaffList(list);
      setLoading(false);
    });
    return () => unsub();
  }, [courseId]);

  // Search for staff users (reads admins node, filters role=staff + query match)
  const searchStaff = useCallback(async (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const snap = await get(ref(db, 'admins'));
      const admins = snap.val() || {};
      const assignedUids = new Set(staffList.map((s) => s.uid));
      const results = Object.entries(admins)
        .filter(([uid, a]) =>
          a.role === 'staff' &&
          a.approved !== false &&
          !assignedUids.has(uid) &&
          (a.displayName?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q))
        )
        .map(([uid, a]) => ({ uid, displayName: a.displayName, username: a.username }))
        .slice(0, 20);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [staffList]);

  // Assign staff: atomic multi-path update
  const assignStaff = useCallback(async (staffUid, staffDisplayName) => {
    if (!courseId || !staffUid) return;
    const updates = {};
    updates[`courses/${courseId}/staff/${staffUid}`] = {
      displayName: staffDisplayName,
      assignedAt: Date.now(),
    };
    updates[`staffCourses/${staffUid}/${courseId}`] = true;
    await update(ref(db), updates);
  }, [courseId]);

  // Remove staff: atomic multi-path removal
  const removeStaff = useCallback(async (staffUid) => {
    if (!courseId || !staffUid) return;
    const updates = {};
    updates[`courses/${courseId}/staff/${staffUid}`] = null;
    updates[`staffCourses/${staffUid}/${courseId}`] = null;
    await update(ref(db), updates);
  }, [courseId]);

  return { staffList, loading, searchStaff, searchResults, searchLoading, assignStaff, removeStaff };
}
