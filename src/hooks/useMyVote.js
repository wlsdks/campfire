import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';

/**
 * Lightweight hook that checks if the current participant already voted.
 * Returns { myVote } — the vote value (string) or null.
 * Only subscribes to this one participant's vote node, not all votes.
 */
export function useMyVote(sessionId, questionId) {
  const [myVote, setMyVote] = useState(null);

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const pid = getParticipantId();
    if (!pid) return;
    const voteRef = ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`);
    const unsub = onValue(voteRef, (snapshot) => {
      const val = snapshot.val();
      setMyVote(val?.value ?? null);
    });
    return () => unsub();
  }, [sessionId, questionId]);

  return { myVote };
}
