import { useState, useCallback, useEffect, useRef } from 'react';
import { ref, onValue, set, update, get, remove, serverTimestamp } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { judgeLiveSubmission, calculateLiveTop3 } from '@/features/assignments/api/gemini';
import { JUDGE_THINKING_SNIPPETS } from '@/features/assignments/api/judges';
import { logger } from '@/lib/logger';

function pickThinking(judgeId) {
  const pool = JUDGE_THINKING_SNIPPETS[judgeId] || [];
  if (pool.length === 0) return '평가 준비 중...';
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Firebase Storage URL에서 storage 경로를 추출해 삭제.
 * 실패해도 throw하지 않음 (cleanup은 best-effort).
 */
async function deleteStorageImage(url) {
  if (!url || typeof url !== 'string') return;
  try {
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) return;
    const path = decodeURIComponent(match[1]);
    await deleteObject(storageRef(storage, path));
  } catch (err) {
    logger.warn('Storage 이미지 삭제 실패:', err?.message || err);
  }
}

/**
 * usePersistentAssignment — 세션에 상시 활성화된 aiJudge 질문 ID 구독 + 쓰기.
 * session.persistentAssignmentId: currentQuestion과 독립적으로 학생 화면에
 * 항상 노출되는 라이브 과제. 강사가 "상시 과제 시작/종료"로 토글.
 */
export function usePersistentAssignment(sessionId) {
  const [assignmentId, setAssignmentId] = useState(null);

  useEffect(() => {
    if (!sessionId) { setAssignmentId(null); return; }
    const r = ref(db, `sessions/${sessionId}/persistentAssignmentId`);
    const unsub = onValue(r, (snap) => setAssignmentId(snap.val() || null));
    return () => unsub();
  }, [sessionId]);

  const setAssignment = useCallback(async (qId) => {
    if (!sessionId) return;
    await update(ref(db, `sessions/${sessionId}`), { persistentAssignmentId: qId || null });
  }, [sessionId]);

  const clearAssignment = useCallback(async () => {
    if (!sessionId) return;
    await update(ref(db, `sessions/${sessionId}`), { persistentAssignmentId: null });
  }, [sessionId]);

  return { assignmentId, setAssignment, clearAssignment };
}

/**
 * useLiveSubmissions — 세션 질문의 제출 목록 구독.
 * Path: sessions/{sid}/questions/{qid}/submissions
 */
export function useLiveSubmissions(sessionId, questionId) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !questionId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    const subRef = ref(db, `sessions/${sessionId}/questions/${questionId}/submissions`);
    const unsub = onValue(subRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0));
      setSubmissions(list);
      setLoading(false);
    }, (err) => {
      logger.error('제출 목록 로드 실패:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId, questionId]);

  return { submissions, loading };
}

/**
 * useMySubmission — 현재 학생의 제출물 하나.
 */
export function useMySubmission(sessionId, questionId, participantId) {
  const [submission, setSubmission] = useState(null);
  useEffect(() => {
    if (!sessionId || !questionId || !participantId) { setSubmission(null); return; }
    const mRef = ref(db, `sessions/${sessionId}/questions/${questionId}/submissions/${participantId}`);
    const unsub = onValue(mRef, (snap) => {
      setSubmission(snap.exists() ? { id: participantId, ...snap.val() } : null);
    });
    return () => unsub();
  }, [sessionId, questionId, participantId]);
  return submission;
}

/**
 * useSubmitLive — 학생 제출 액션.
 */
export function useSubmitLive(sessionId, questionId) {
  const submit = useCallback(async (participantId, { name, title, description, imageUrl, code }) => {
    if (!sessionId || !questionId || !participantId) throw new Error('세션 정보 누락');
    // 기존 이미지 URL이 다르면 이전 이미지는 Storage에서 삭제 (재제출 누수 방지)
    const prevSnap = await get(ref(db, `sessions/${sessionId}/questions/${questionId}/submissions/${participantId}`));
    const prevImageUrl = prevSnap.val()?.imageUrl;
    if (prevImageUrl && prevImageUrl !== imageUrl) {
      await deleteStorageImage(prevImageUrl);
    }
    const submission = {
      name: name || '익명',
      title: title || '',
      description: description || '',
      imageUrl: imageUrl || null,
      code: code || '',
      submittedAt: serverTimestamp(),
    };
    await set(ref(db, `sessions/${sessionId}/questions/${questionId}/submissions/${participantId}`), submission);
  }, [sessionId, questionId]);

  const withdraw = useCallback(async (participantId) => {
    if (!sessionId || !questionId || !participantId) return;
    // 제출 취소 시 이미지도 Storage에서 정리
    const snap = await get(ref(db, `sessions/${sessionId}/questions/${questionId}/submissions/${participantId}`));
    const imageUrl = snap.val()?.imageUrl;
    if (imageUrl) await deleteStorageImage(imageUrl);
    await remove(ref(db, `sessions/${sessionId}/questions/${questionId}/submissions/${participantId}`));
  }, [sessionId, questionId]);

  return { submit, withdraw };
}

/**
 * useLiveJudgeResults — 심사 결과 + Top3 구독.
 */
export function useLiveJudgeResults(sessionId, questionId) {
  const [results, setResults] = useState({});
  const [top3, setTop3] = useState(null);
  const [judgeState, setJudgeState] = useState(null); // { status, progress }
  const [judgeLog, setJudgeLog] = useState(null); // 라이브 판사 thinking/done 로그

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const base = `sessions/${sessionId}/questions/${questionId}`;
    const unsubResults = onValue(ref(db, `${base}/aiResults`), (snap) => {
      setResults(snap.val() || {});
    });
    const unsubTop3 = onValue(ref(db, `${base}/aiTop3`), (snap) => {
      setTop3(snap.val() || null);
    });
    const unsubState = onValue(ref(db, `${base}/aiJudgeState`), (snap) => {
      setJudgeState(snap.val() || null);
    });
    const unsubLog = onValue(ref(db, `${base}/aiJudgeLog`), (snap) => {
      setJudgeLog(snap.val() || null);
    });
    return () => { unsubResults(); unsubTop3(); unsubState(); unsubLog(); };
  }, [sessionId, questionId]);

  return { results, top3, judgeState, judgeLog };
}

/**
 * useLiveJudging — 강사용 심사 오케스트레이터.
 * 세션 질문의 모든 제출을 순차 심사 → results + top3 저장.
 */
export function useLiveJudging(sessionId, questionId) {
  const [isJudging, setIsJudging] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, currentName }
  const abortRef = useRef(false);
  const judgingRef = useRef(false);

  const startJudging = useCallback(async () => {
    if (!sessionId || !questionId || judgingRef.current) return;
    judgingRef.current = true;
    abortRef.current = false;
    setIsJudging(true);
    const base = `sessions/${sessionId}/questions/${questionId}`;

    try {
      const snap = await get(ref(db, `${base}/submissions`));
      const data = snap.val() || {};
      const submissions = Object.entries(data).map(([id, v]) => ({ id, ...v }));

      if (submissions.length === 0) {
        await update(ref(db, base), { aiJudgeState: { status: 'idle' } });
        setIsJudging(false);
        judgingRef.current = false;
        return;
      }

      const qSnap = await get(ref(db, `${base}/title`));
      const questionTitle = qSnap.val() || '';

      await update(ref(db, base), {
        aiJudgeState: { status: 'judging', startedAt: serverTimestamp(), total: submissions.length },
        aiResults: null,
        aiTop3: null,
      });

      const allResults = [];
      // 배치 동시 심사 — 100명 규모에서 총 소요시간을 1/CONCURRENCY로 단축.
      // 값이 너무 크면 Gemini RPM 한계에 걸림 (유료 1000 RPM 기준 5~6 배치가 안전).
      //
      // pacing: 5 → 2로 낮춤. 이유: 전자칠판에 "현재 심사 중" 제출자가 너무 빨리 교체돼서
      // 학생들이 심사 과정(판사들이 고민하는 모습)을 체감할 시간이 부족했음. 2명 동시면
      // 30명 기준 약 2분(한 건당 ~10초)으로 라이브 수업 긴장감과 속도 균형.
      const CONCURRENCY = 2;
      let completed = 0;
      let running = 0;
      let index = 0;

      await new Promise((resolveAll) => {
        const scheduleNext = () => {
          if (abortRef.current) {
            if (running === 0) resolveAll();
            return;
          }
          while (running < CONCURRENCY && index < submissions.length) {
            const myIdx = index++;
            const sub = submissions[myIdx];
            running++;
            (async () => {
              // "현재 심사 중" 표시는 새로 시작한 제출로 갱신 (여러 건 동시 중이어도 최신 하나만 노출)
              await update(ref(db, `${base}/aiJudgeState`), {
                status: 'judging',
                current: completed + 1,
                total: submissions.length,
                currentName: sub.name,
              });
              try {
                // 새 제출자 심사 시작 시 이전 판사 로그 초기화 (전자칠판 표시용)
                await set(ref(db, `${base}/aiJudgeLog`), {
                  currentSubmissionId: sub.id,
                  currentName: sub.name,
                  startedAt: serverTimestamp(),
                  judges: null,
                });
                const { results, summary } = await judgeLiveSubmission(
                  sub,
                  questionTitle,
                  // onJudgeComplete: 판사 완료 시 점수/하이라이트 방송
                  async (judgeId, result) => {
                    await update(ref(db, `${base}/aiJudgeLog/judges/${judgeId}`), {
                      name: result.judgeName,
                      state: result.error ? 'error' : 'done',
                      hint: result.highlight || result.comment?.slice(0, 40) || '평가 완료',
                      score: result.score ?? null,
                      at: Date.now(),
                    });
                  },
                  // onJudgeStart: 판사 thinking 방송
                  async (judge) => {
                    await update(ref(db, `${base}/aiJudgeLog/judges/${judge.id}`), {
                      name: judge.name,
                      state: 'thinking',
                      hint: pickThinking(judge.id),
                      at: Date.now(),
                    });
                  }
                );
                await set(ref(db, `${base}/aiResults/${sub.id}`), {
                  judges: results,
                  summary,
                  judgedAt: serverTimestamp(),
                });
                allResults.push({ submissionId: sub.id, name: sub.name, results, summary });
              } catch (err) {
                logger.error(`제출 ${sub.name} 심사 실패:`, err);
                // 실패한 제출은 allResults에서 제외 — calculateLiveTop3가 totalJudges===0 필터링
              }
              completed++;
              running--;
              setProgress({ current: completed, total: submissions.length, currentName: sub.name });
              scheduleNext();
            })();
          }
          if (running === 0 && index >= submissions.length) resolveAll();
        };
        scheduleNext();
      });

      if (!abortRef.current) {
        const top3 = calculateLiveTop3(allResults);
        await set(ref(db, `${base}/aiTop3`), top3);
        await update(ref(db, `${base}/aiJudgeState`), {
          status: 'done',
          completedAt: serverTimestamp(),
          // 학생 폰에는 자기 점수만 보이고, TOP 공개는 강사가 버튼으로 단계적으로 올림 (0→1→2→3)
          revealedUpTo: 0,
        });
        // 심사 완료 후 라이브 로그 정리
        await remove(ref(db, `${base}/aiJudgeLog`));
      } else {
        await update(ref(db, `${base}/aiJudgeState`), { status: 'aborted' });
      }
    } catch (err) {
      logger.error('라이브 심사 실행 실패:', err);
      await update(ref(db, `${base}/aiJudgeState`), { status: 'error', message: err.message || '알 수 없는 오류' });
    } finally {
      judgingRef.current = false;
      setIsJudging(false);
      setProgress(null);
    }
  }, [sessionId, questionId]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(async () => {
    if (!sessionId || !questionId) return;
    const base = `sessions/${sessionId}/questions/${questionId}`;
    await update(ref(db, base), {
      aiJudgeState: null,
      aiResults: null,
      aiTop3: null,
      aiJudgeLog: null,
    });
  }, [sessionId, questionId]);

  const setRevealedUpTo = useCallback(async (n) => {
    if (!sessionId || !questionId) return;
    const clamped = Math.max(0, Math.min(3, n));
    await update(ref(db, `sessions/${sessionId}/questions/${questionId}/aiJudgeState`), {
      revealedUpTo: clamped,
    });
  }, [sessionId, questionId]);

  return { startJudging, isJudging, progress, abort, reset, setRevealedUpTo };
}
