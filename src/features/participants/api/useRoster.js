import { useCallback } from 'react';
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { uuid } from '@/lib/utils';
import { normalizeRosterRows, rosterDisplayName, ROSTER_SOURCE } from '@/lib/roster';

/**
 * 명단 저장 액션.
 *
 * 저장은 항상 "화면에 보이는 명단 = 최종 상태"로 맞춘다(전체 동기화).
 * 행 추가/수정/삭제를 개별 write로 쪼개면 중간에 실패했을 때 화면과 DB가 어긋나므로,
 * multi-path update 한 번으로 원자적으로 반영한다.
 *
 * @param {string} sessionId
 * @returns {{ saveRoster: (rows: Array, existingRows: Array) => Promise<{count: number, duplicates: string[]}> }}
 */
export function useRosterActions(sessionId) {
  const saveRoster = useCallback(async (rows, existingRows = []) => {
    if (!sessionId) return { count: 0, duplicates: [] };

    const { rows: clean, duplicates } = normalizeRosterRows(rows);
    const updates = {};
    const keptIds = new Set();

    clean.forEach((row, index) => {
      const id = row.id || `manual_${uuid().slice(0, 8)}`;
      keptIds.add(id);
      updates[`${id}/nickname`] = rosterDisplayName(row);
      updates[`${id}/employeeId`] = row.employeeId || null;
      updates[`${id}/source`] = ROSTER_SOURCE;
      updates[`${id}/order`] = index;
      // online:true — 추첨 대상은 onlineList에서 파생된다(useAdminSession drawParticipants).
      // 명단 인원은 접속하지 않으므로 여기서 직접 세워둔다.
      updates[`${id}/online`] = true;
      if (!row.id) updates[`${id}/joinedAt`] = serverTimestamp();
    });

    // 화면에서 지운 행은 참여자 노드째 제거
    for (const existing of existingRows) {
      if (!keptIds.has(existing.id)) updates[existing.id] = null;
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db, `sessions/${sessionId}/participants`), updates);
    }
    return { count: clean.length, duplicates };
  }, [sessionId]);

  return { saveRoster };
}
