import { useState, useEffect, useCallback } from 'react';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { uuid } from '@/lib/utils';

function generateCourseId() {
  return 'crs_' + uuid().slice(0, 8);
}

/**
 * Hook for managing courses with role-based filtering.
 * - master: sees all courses
 * - admin (instructor): sees own courses (ownerId === adminUid)
 * - staff: sees assigned courses via staffCourses/{uid} reverse index
 *
 * @param {string} adminUid
 * @param {string} role - 'master' | 'admin' | 'staff'
 * @returns {{ courses, loading, createCourse, deleteCourse, refresh }}
 */
export function useCourses(adminUid, role) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!adminUid) return;
    setLoading(true);
    try {
      if (role === 'staff') {
        // Staff: read reverse index then batch-fetch courses
        const indexSnap = await get(ref(db, `staffCourses/${adminUid}`));
        const indexVal = indexSnap.val();
        if (!indexVal) {
          setCourses([]);
          setLoading(false);
          return;
        }
        const courseIds = Object.keys(indexVal);
        const results = await Promise.all(
          courseIds.map(async (id) => {
            const snap = await get(ref(db, `courses/${id}`));
            const val = snap.val();
            return val ? { id, ...val } : null;
          })
        );
        setCourses(results.filter(Boolean));
      } else {
        // Master / admin: fetch all courses, filter client-side
        const snap = await get(ref(db, 'courses'));
        const val = snap.val() || {};
        const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
        if (role === 'admin') {
          setCourses(list.filter((c) => c.ownerId === adminUid));
        } else {
          setCourses(list); // master sees all
        }
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [adminUid, role]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = useCallback(async (name, ownerName) => {
    const id = generateCourseId();
    await set(ref(db, `courses/${id}`), {
      name,
      ownerId: adminUid,
      ownerName: ownerName || '',
      createdAt: Date.now(),
    });
    await fetchCourses();
    return id;
  }, [adminUid, fetchCourses]);

  const deleteCourse = useCallback(async (courseId) => {
    await remove(ref(db, `courses/${courseId}`));
    // Clean up staffCourses reverse index entries
    const staffSnap = await get(ref(db, `courses/${courseId}/staff`));
    if (staffSnap.val()) {
      await Promise.all(
        Object.keys(staffSnap.val()).map((uid) =>
          remove(ref(db, `staffCourses/${uid}/${courseId}`))
        )
      );
    }
    await fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, createCourse, deleteCourse, refresh: fetchCourses };
}
