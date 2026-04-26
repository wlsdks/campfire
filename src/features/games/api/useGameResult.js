import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';

// P0-1c: 강사가 데스크톱(/admin) + 전자칠판(/live) 둘 다 열고 lottery 버튼을
// 양쪽에서 트리거하면 각 화면이 독립적으로 random winner를 publish.
// last-write-wins라 학생에게 잘못된 winner 노출 가능.
//
// 해결: runTransaction으로 atomic first-wins. 같은 mode의 결과가 2초 내에
// 이미 publish됐으면 transaction abort (중복 draw로 간주).
// 새 round (>2초 간격)는 새 winner로 정상 덮어쓰기.
const PUBLISH_DEDUP_MS = 2000;

/**
 * Writes a game result to Firebase atomically.
 * Called from presenter/admin/live when a game completes.
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
      resultId: `${mode}_${Date.now()}`,
      timestamp: Date.now(),
    };

    const resultRef = ref(db, `sessions/${sessionId}/gameResult`);
    await runTransaction(resultRef, (current) => {
      if (current && current.mode === mode && current.timestamp
          && Date.now() - current.timestamp < PUBLISH_DEDUP_MS) {
        return; // abort — 다른 화면이 직전에 같은 게임 결과 publish함
      }
      return result;
    });
  }, [sessionId]);

  return { publishResult };
}

/**
 * Listens for game results on the student side.
 * Returns the current game result and whether this student won.
 *
 * @param {string} sessionId
 * @returns {{ gameResult, isWinner, winnerNames, showOverlay, dismiss }}
 */
export function useGameResult(sessionId) {
  const [gameResult, setGameResult] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const resultRef = ref(db, `sessions/${sessionId}/gameResult`);
    const unsub = onValue(resultRef, (snap) => {
      setGameResult(snap.val() || null);
    });

    return () => unsub();
  }, [sessionId]);

  const participantId = getParticipantId();

  const isWinner = gameResult?.winners?.some((w) => w.id === participantId) ?? false;
  const winnerNames = gameResult?.winners?.map((w) => w.nickname) ?? [];

  // Dismiss: hide the overlay using stable resultId
  const dismiss = useCallback(() => {
    if (gameResult) {
      setDismissedId(gameResult.resultId || null);
    }
  }, [gameResult]);

  // Show overlay only if result exists and hasn't been dismissed
  const showOverlay = Boolean(gameResult && gameResult.resultId && gameResult.resultId !== dismissedId);

  return { gameResult, isWinner, winnerNames, showOverlay, dismiss };
}
