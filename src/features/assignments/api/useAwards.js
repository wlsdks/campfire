import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * useAwards — 과제의 시상 결과 구독.
 */
export function useAwards(assignmentId) {
  const [awards, setAwards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) { setAwards(null); setLoading(false); return; }

    const awardsRef = ref(db, `assignments/${assignmentId}/awards`);
    const unsub = onValue(awardsRef, (snap) => {
      setAwards(snap.exists() ? snap.val() : null);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, [assignmentId]);

  return { awards, loading };
}

/**
 * useAllResults — 과제의 전체 심사 결과 구독.
 */
export function useAllResults(assignmentId) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) { setResults({}); setLoading(false); return; }

    const resultsRef = ref(db, `assignments/${assignmentId}/results`);
    const unsub = onValue(resultsRef, (snap) => {
      setResults(snap.val() || {});
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, [assignmentId]);

  return { results, loading };
}
