import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';

/**
 * Writes a game result to Firebase.
 * Called from presenter/admin when a game completes.
 *
 * @param {string} sessionId
 * @returns {{ publishResult: (mode, winners, allParticipantIds) => Promise }}
 */
export function usePublishGameResult(sessionId) {
  const publishResult = useCallback(async (mode, winners, allParticipantIds = []) => {
    if (!sessionId || !winners || winners.length === 0) return;

    const result = {
      mode,
      winners, // Array of { id, nickname }
      allParticipantIds,
      timestamp: serverTimestamp(),
    };

    await set(ref(db, `sessions/${sessionId}/gameResult`), result);
  }, [sessionId]);

  return { publishResult };
}

/**
 * Listens for game results on the student side.
 * Returns the current game result and whether this student won.
 *
 * @param {string} sessionId
 * @returns {{ gameResult, isWinner, winnerNames, dismissed, dismiss }}
 */
export function useGameResult(sessionId) {
  const [gameResult, setGameResult] = useState(null);
  const [dismissed, setDismissed] = useState(null); // timestamp of dismissed result

  useEffect(() => {
    if (!sessionId) return;

    const resultRef = ref(db, `sessions/${sessionId}/gameResult`);
    const unsub = onValue(resultRef, (snap) => {
      const val = snap.val();
      setGameResult(val || null);
    });

    return () => unsub();
  }, [sessionId]);

  const participantId = getParticipantId();

  const isWinner = gameResult?.winners?.some((w) => w.id === participantId) ?? false;
  const winnerNames = gameResult?.winners?.map((w) => w.nickname) ?? [];

  // Dismiss: hide the overlay but remember which result was dismissed
  const dismiss = useCallback(() => {
    if (gameResult?.timestamp) {
      setDismissed(gameResult.timestamp);
    }
  }, [gameResult?.timestamp]);

  // Show overlay only if result exists and hasn't been dismissed
  const showOverlay = gameResult && gameResult.timestamp !== dismissed;

  return { gameResult, isWinner, winnerNames, showOverlay, dismiss };
}
