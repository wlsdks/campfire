import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * 추첨 화면을 강사 화면 ↔ 전자칠판 사이에 동기화한다.
 *
 * 전자칠판은 조작하는 곳이 아니라 **비추는 곳**이다. 두 화면이 각자 추첨을 돌리면 관객이 보는
 * 결과와 강사가 부르는 결과가 서로 달라진다. 그래서 조작은 강사 화면(control)만 하고,
 * 진행 상태를 세션에 실어 전자칠판(view)이 그대로 따라 그린다.
 *
 * 저장 위치는 세션의 gameState — 질문을 넘기면 useQuestionActions가 함께 비우므로
 * 이전 판의 잔재가 다음 화면에 남지 않는다. 게임마다 mode로 구분해 한 노드를 나눠 쓴다.
 *
 * @param {string} sessionId
 * @param {{ role: 'control' | 'view', mode: string }} opts
 * @returns {{ remote: object|null, publish: (state: object) => void }}
 */
export function useGameMirror(sessionId, { role, mode }) {
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    if (!sessionId || role !== 'view') return;
    const unsub = onValue(ref(db, `sessions/${sessionId}/gameState`), (snapshot) => {
      const value = snapshot.val();
      // 다른 게임이 쓴 gameState를 이 게임 상태로 오독하지 않도록 mode를 확인한다
      setRemote(value && value.mode === mode ? value : null);
    });
    return () => unsub();
  }, [sessionId, role, mode]);

  const publish = useCallback((state) => {
    if (!sessionId || role !== 'control') return;
    update(ref(db, `sessions/${sessionId}`), {
      gameState: { mode, ...state },
    }).catch(() => { /* 전자칠판 미러링 실패가 강사 화면 추첨을 막지는 않는다 */ });
  }, [sessionId, role, mode]);

  return { remote, publish };
}
