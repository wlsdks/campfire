import { useState, useCallback, useRef } from 'react';
import { ref, set, update, get, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { judgeSubmission } from '@/lib/judging/gemini';
import { calculateAwards } from '@/lib/judging/awards';
import { logger } from '@/lib/logger';

/**
 * useJudging — 심사 오케스트레이션 훅.
 * 강사가 "심사 시작" 누르면 모든 제출물을 순차 심사.
 */
export function useJudging(assignmentId) {
  const [isJudging, setIsJudging] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, currentJudge, currentSubmission }
  const abortRef = useRef(false);
  const judgingRef = useRef(false);

  const startJudging = useCallback(async () => {
    if (!assignmentId || judgingRef.current) return;
    judgingRef.current = true;
    abortRef.current = false;
    setIsJudging(true);

    try {
      // Update assignment status
      await update(ref(db, `assignments/${assignmentId}`), { status: 'judging' });

      // Read passThreshold (default 3 for backward compatibility)
      const assignSnap = await get(ref(db, `assignments/${assignmentId}`));
      const passThreshold = assignSnap.val()?.passThreshold ?? 3;

      // Fetch all submissions
      const subsSnap = await get(ref(db, `assignments/${assignmentId}/submissions`));
      const subsData = subsSnap.val() || {};
      const submissions = Object.entries(subsData).map(([id, v]) => ({ id, ...v }));

      if (submissions.length === 0) {
        await update(ref(db, `assignments/${assignmentId}`), { status: 'open' });
        setIsJudging(false);
        return;
      }

      const allResults = [];

      for (let i = 0; i < submissions.length; i++) {
        if (abortRef.current) break;

        const sub = submissions[i];
        setProgress({
          current: i + 1,
          total: submissions.length,
          currentSubmission: sub.name,
          currentJudge: null,
        });

        // Judge this submission
        const { results, summary } = await judgeSubmission(sub, (judgeId) => {
          setProgress(prev => prev ? { ...prev, currentJudge: judgeId } : prev);
        }, passThreshold);

        // Save results to Firebase
        await set(ref(db, `assignments/${assignmentId}/results/${sub.id}`), {
          judges: results,
          summary,
          judgedAt: serverTimestamp(),
        });

        allResults.push({
          submissionId: sub.id,
          name: sub.name,
          results,
          summary,
        });
      }

      if (!abortRef.current) {
        // Calculate and save awards
        const awards = calculateAwards(allResults);
        await set(ref(db, `assignments/${assignmentId}/awards`), awards);

        // Update status to judged
        await update(ref(db, `assignments/${assignmentId}`), {
          status: 'judged',
          judgedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      logger.error('심사 실행 실패:', err);
      // status는 open으로 되돌려 재시도 가능하게 하고, 원인을 judgeError에 남김(조용한 실패 방지).
      // 이 복구 update 자체가 실패해도 unhandled rejection이 되지 않도록 보호.
      await update(ref(db, `assignments/${assignmentId}`), {
        status: 'open',
        judgeError: err?.message || '심사 중 오류가 발생했습니다',
      }).catch(() => { /* 복구 write 실패는 무시 */ });
    } finally {
      judgingRef.current = false;
      setIsJudging(false);
      setProgress(null);
    }
  }, [assignmentId]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { startJudging, isJudging, progress, abort };
}
