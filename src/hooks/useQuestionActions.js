import { useState, useCallback, useMemo } from 'react';
import { ref, set, remove, update, get } from 'firebase/database';
import { getServerNow } from '@/features/timer/api/useTimer';
import { db } from '@/lib/firebase';
import { generateQuestionId } from '@/lib/utils';
import {
  QUIZ_DEFAULTS,
  getQuestionMode,
  getQuizReward,
  isQuizQuestion,
  normalizeQuizEvent,
} from '@/lib/quiz';
import { useToast } from '@/hooks/useToast';

// 서버 시간 기준 — 강사 기기 시계 오차 없이 activatedAt/revealedAt/awardedAt 등
// 모든 시간 필드가 일관된 기준으로 저장됨 (timer의 endTime과 동일 기준).
function getNow() {
  return getServerNow();
}

// P1-6: revealQuiz가 점수 batch 도중에 currentQuestion이 바뀌면 학생이 lastPoints를
// 보기 전에 다음 질문으로 넘어감. module-level Map으로 동일 세션 내 모든
// useQuestionActions 인스턴스가 공유. revealQuiz Phase 2 시작 시 set, 끝나면 delete.
const revealLocks = new Map();

async function awaitRevealLock(sessionId) {
  const pending = revealLocks.get(sessionId);
  if (pending) await pending;
}

// P1-8: resetAllQuestions가 학생-write 영역(handRaises/urgentQuestions/chat)을 null로
// 비우는 순간 인플라이트 학생 write가 도착하면 잔존 데이터 발생. 600ms 후 재-sweep으로
// catch. 같은 세션에서 새 reset이 곧이어 발생하면 직전 sweep은 무효화 (epoch 비교).
const resetEpochs = new Map();

export function useQuestionActions(sessionId, questions, currentQuestion, scores, participants) {
  const [error, setError] = useState(null);
  const { toast, showToast } = useToast();

  const questionList = useMemo(
    () => Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0)),
    [questions]
  );

  async function handleSubmit({ type, title, options: cleanOptions, correctAnswer, points, event, betting, hints, mysteryItems, answerReasons, acceptableAnswers, winners, imageUrl, slideImages, hideTitle, modelAnswer }) {
    try {
      setError(null);
      const qId = generateQuestionId();
      const questionData = { type, title: title.trim(), order: Object.keys(questions || {}).length + 1 };
      if (imageUrl) questionData.imageUrl = imageUrl;
      if (hideTitle) questionData.hideTitle = true;
      if (type === 'imageSlide' && slideImages?.length > 0) questionData.slideImages = slideImages;
      const isChoiceLike = type === 'choice' || type === 'quiz';

      if (isChoiceLike) {
        questionData.options = cleanOptions;
        questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
      }
      if (type === 'ranking') {
        questionData.options = cleanOptions;
        questionData.correctAnswer = cleanOptions.map((_, i) => String(i)).join(',');
      }
      if (type === 'fillinblank') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
      }
      if (type === 'ox') {
        questionData.correctAnswer = correctAnswer || 'O';
      }
      if (type === 'mysteryBox') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
        if (mysteryItems?.length > 0) questionData.mysteryItems = mysteryItems;
        if (answerReasons?.length > 0) questionData.answerReasons = answerReasons;
        if (winners?.length > 0) questionData.winners = winners;
      }
      if (type === 'hintQuiz') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
        questionData.hints = hints || [];
        questionData.revealedHints = 0;
        if (answerReasons?.length > 0) questionData.answerReasons = answerReasons;
        if (acceptableAnswers?.length > 0) questionData.acceptableAnswers = acceptableAnswers;
        if (winners?.length > 0) questionData.winners = winners;
      }
      if (type === 'quiz') {
        questionData.points = points || QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
        if (event) questionData.event = event;
        if (betting) questionData.betting = true;
      }
      if (type === 'subjective' && modelAnswer?.trim()) {
        questionData.modelAnswer = modelAnswer.trim();
      }

      await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
      return true;
    } catch {
      setError('질문 저장에 실패했습니다. 다시 시도해주세요.');
      return false;
    }
  }

  async function activateQuestion(qId, nextEvent) {
    const question = questions?.[qId];
    if (!question) return;

    // 진행 중인 reveal batch 완료 대기 — lastPoints 보존
    if (revealLocks.has(sessionId)) {
      showToast('정답 공개 중... 잠시만 기다려주세요');
      await awaitRevealLock(sessionId);
    }

    try {
      const updates = {
        currentQuestion: qId,
        currentMode: getQuestionMode(question),
      };

      // 모든 질문 유형: 활성화 시 revealedAt 초기화
      updates[`questions/${qId}/activatedAt`] = getNow();
      updates[`questions/${qId}/revealedAt`] = null;

      if (isQuizQuestion(question)) {
        updates[`questions/${qId}/awardedAt`] = null;
        if (nextEvent) {
          updates[`questions/${qId}/event`] = normalizeQuizEvent(nextEvent);
        }
      }

      // 힌트 퀴즈: 힌트도 초기화
      if (question.type === 'hintQuiz') {
        updates[`questions/${qId}/revealedHints`] = 0;
      }
      // 미스터리 박스/힌트 퀴즈: 당첨자 공개 초기화
      if (['mysteryBox', 'hintQuiz'].includes(question.type)) {
        updates[`questions/${qId}/revealedWinners`] = 0;
      }
      // 이미지 슬라이드: 첫 번째로 초기화
      if (question.type === 'imageSlide') {
        updates[`questions/${qId}/currentSlide`] = 0;
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast('질문이 활성화되었습니다');
    } catch {
      // Silently fail
    }
  }

  const clearActive = useCallback(async () => {
    if (revealLocks.has(sessionId)) await awaitRevealLock(sessionId);
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
    } catch {
      // Silently fail
    }
  }, [sessionId]);

  async function updateQuestion(qId, { type, title, options: cleanOptions, correctAnswer, points, event, betting, hints, mysteryItems, answerReasons, acceptableAnswers, winners, imageUrl, slideImages, hideTitle, modelAnswer }) {
    try {
      setError(null);
      const existing = questions?.[qId];
      if (!existing) return false;

      const questionData = { ...existing, type, title: title.trim() };
      // Remove stale fields that may not apply to new type
      delete questionData.options;
      delete questionData.correctAnswer;
      delete questionData.points;
      delete questionData.participationTickets;
      delete questionData.correctBonusTickets;
      delete questionData.speedWindowMs;
      delete questionData.maxSpeedBonus;
      delete questionData.event;
      delete questionData.betting;
      delete questionData.hints;
      delete questionData.revealedHints;
      delete questionData.mysteryItems;
      delete questionData.answerReasons;
      delete questionData.acceptableAnswers;
      delete questionData.winners;
      delete questionData.slideImages;
      delete questionData.imageUrl;
      delete questionData.hideTitle;
      delete questionData.modelAnswer;

      const isChoiceLike = type === 'choice' || type === 'quiz';
      if (isChoiceLike) {
        questionData.options = cleanOptions;
        questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
      }
      if (type === 'ranking') {
        questionData.options = cleanOptions;
        questionData.correctAnswer = cleanOptions.map((_, i) => String(i)).join(',');
      }
      if (type === 'fillinblank') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
      }
      if (type === 'ox') {
        questionData.correctAnswer = correctAnswer || 'O';
      }
      if (type === 'mysteryBox') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
        if (mysteryItems?.length > 0) questionData.mysteryItems = mysteryItems;
        if (answerReasons?.length > 0) questionData.answerReasons = answerReasons;
        if (winners?.length > 0) questionData.winners = winners;
      }
      if (type === 'hintQuiz') {
        questionData.correctAnswer = correctAnswer?.trim() || '';
        questionData.hints = hints || [];
        questionData.revealedHints = 0;
        if (answerReasons?.length > 0) questionData.answerReasons = answerReasons;
        if (acceptableAnswers?.length > 0) questionData.acceptableAnswers = acceptableAnswers;
        if (winners?.length > 0) questionData.winners = winners;
      }
      if (type === 'quiz') {
        questionData.points = points || QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
        if (event) questionData.event = event;
        if (betting) questionData.betting = true;
      }
      if (type === 'subjective' && modelAnswer?.trim()) questionData.modelAnswer = modelAnswer.trim();
      if (imageUrl) questionData.imageUrl = imageUrl;
      if (hideTitle) questionData.hideTitle = true;
      if (type === 'imageSlide' && slideImages?.length > 0) questionData.slideImages = slideImages;

      await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
      showToast('질문이 수정되었습니다');
      return true;
    } catch {
      setError('질문 수정에 실패했습니다. 다시 시도해주세요.');
      return false;
    }
  }

  async function deleteQuestion(qId) {
    try {
      // 상시 과제(aiJudge)로 등록된 질문이면 세션의 persistentAssignmentId도 함께 정리 — 고아 참조 방지.
      const persistentSnap = await get(ref(db, `sessions/${sessionId}/persistentAssignmentId`));
      const isPersistent = persistentSnap.val() === qId;
      const updates = { [`questions/${qId}`]: null };
      if (isPersistent) updates.persistentAssignmentId = null;
      await update(ref(db, `sessions/${sessionId}`), updates);
      if (currentQuestion === qId) await clearActive();
      showToast('질문이 삭제되었습니다');
    } catch {
      // Silently fail
    }
  }

  async function duplicateQuestion(qId) {
    const source = questions?.[qId];
    if (!source) return;

    try {
      setError(null);
      const newId = generateQuestionId();
      const nextOrder = questionList.length + 1;
      const { votes: _votes, aiGrades: _aiGrades, activatedAt: _activatedAt, revealedAt: _revealedAt, awardedAt: _awardedAt, event: _event, ...rest } = source;
      await set(ref(db, `sessions/${sessionId}/questions/${newId}`), { ...rest, title: `${source.title} (복사)`, order: nextOrder });
      showToast('질문이 복제되었습니다');
    } catch {
      setError('질문 복제에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function moveQuestion(qId, direction) {
    const idx = questionList.findIndex(([id]) => id === qId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questionList.length) return;

    const [currentId, currentQ] = questionList[idx];
    const [swapId, swapQ] = questionList[swapIdx];

    try {
      await update(ref(db, `sessions/${sessionId}`), {
        [`questions/${currentId}/order`]: swapQ.order ?? swapIdx + 1,
        [`questions/${swapId}/order`]: currentQ.order ?? idx + 1,
      });
    } catch {
      // Silently fail
    }
  }

  async function reorderQuestion(fromId, toId) {
    const fromIdx = questionList.findIndex(([id]) => id === fromId);
    const toIdx = questionList.findIndex(([id]) => id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    try {
      const updates = {};
      const reordered = [...questionList];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      reordered.forEach(([id], i) => { updates[`questions/${id}/order`] = i + 1; });
      await update(ref(db, `sessions/${sessionId}`), updates);
    } catch {
      // Silently fail
    }
  }

  async function importFromLibrary(libraryQuestions) {
    if (!libraryQuestions || libraryQuestions.length === 0) return;
    try {
      const updates = {};
      const currentCount = questionList.length;
      libraryQuestions.forEach((lq, i) => {
        const newId = generateQuestionId();
        const { id: _id, savedAt: _s, updatedAt: _u, tag: _t, ...questionData } = lq;
        updates[`questions/${newId}`] = { ...questionData, order: currentCount + i + 1 };
      });
      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast(`${libraryQuestions.length}개 질문이 추가되었습니다`);
    } catch {
      setError('보관함에서 질문 가져오기에 실패했습니다.');
    }
  }

  async function revealQuiz(qId) {
    const question = questions?.[qId];
    if (!isQuizQuestion(question)) return;

    try {
      const now = getNow();
      const voteEntries = Object.entries(question.votes || {});

      // Phase 1: Reveal answer + mark awarded
      const revealUpdates = {
        currentMode: 'quiz',
        [`questions/${qId}/revealedAt`]: now,
      };
      if (!question.awardedAt) {
        revealUpdates[`questions/${qId}/awardedAt`] = now;
      }
      await update(ref(db, `sessions/${sessionId}`), revealUpdates);

      // Phase 2: Score updates in batches of 50 — lock으로 감싸 도중 currentQuestion 변경 방지
      if (!question.awardedAt) {
        // 이전 reveal이 아직 batch 도중이면 (드물게) 완료 대기
        await awaitRevealLock(sessionId);
        let resolveLock;
        const lockPromise = new Promise((r) => { resolveLock = r; });
        revealLocks.set(sessionId, lockPromise);
        try {
          const BATCH_SIZE = 50;
          for (let i = 0; i < voteEntries.length; i += BATCH_SIZE) {
            const batch = voteEntries.slice(i, i + BATCH_SIZE);
            const scoreUpdates = {};
            batch.forEach(([participantId, vote]) => {
              const reward = getQuizReward(question, vote);
              const existingScore = (scores || {})[participantId] || {};
              const nextStreak = reward.isCorrect ? (existingScore.streak || 0) + 1 : 0;
              const nickname = (participants || {})[participantId]?.nickname || vote.nickname || existingScore.nickname || `참여자 ${participantId.slice(0, 4)}`;
              const newTotal = Math.max(0, (existingScore.total || 0) + reward.points);

              scoreUpdates[`scores/${participantId}`] = {
                nickname,
                total: newTotal,
                tickets: (existingScore.tickets || 0) + reward.tickets,
                lastPoints: reward.points,
                lastTickets: reward.tickets,
                streak: nextStreak,
                bestStreak: Math.max(existingScore.bestStreak || 0, nextStreak),
                lastQuestionId: qId,
                updatedAt: now,
              };
            });
            await update(ref(db, `sessions/${sessionId}`), scoreUpdates);
          }
        } finally {
          revealLocks.delete(sessionId);
          resolveLock();
        }
      }
    } catch {
      setError('정답 공개와 점수 반영에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function revealHint(qId) {
    const question = questions?.[qId];
    if (question?.type !== 'hintQuiz') return;
    const maxHints = (question.hints || []).length;
    const current = question.revealedHints || 0;
    if (current >= maxHints) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), {
        [`questions/${qId}/revealedHints`]: current + 1,
      });
    } catch {
      // Silently fail
    }
  }

  async function revealAnswer(qId) {
    const question = questions?.[qId];
    if (!question) return;
    // quiz 타입은 revealQuiz를 사용, 나머지 정답형은 여기서 처리
    if (isQuizQuestion(question)) return;
    try {
      await update(ref(db, `sessions/${sessionId}`), {
        [`questions/${qId}/revealedAt`]: getNow(),
      });
    } catch {
      setError('정답 공개에 실패했습니다.');
    }
  }

  const showLeaderboard = useCallback(async () => {
    if (revealLocks.has(sessionId)) await awaitRevealLock(sessionId);
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentMode: 'leaderboard' });
    } catch {
      setError('리더보드 전환에 실패했습니다. 다시 시도해주세요.');
    }
  }, [sessionId]);

  const armEvent = useCallback(async (eventPreset) => {
    try {
      setError(null);
      await set(ref(db, `sessions/${sessionId}/pendingEvent`), eventPreset);
    } catch {
      setError('이벤트 예약에 실패했습니다. 다시 시도해주세요.');
    }
  }, [sessionId]);

  const clearPendingEvent = useCallback(async () => {
    try {
      setError(null);
      await remove(ref(db, `sessions/${sessionId}/pendingEvent`));
    } catch {
      setError('이벤트 해제에 실패했습니다. 다시 시도해주세요.');
    }
  }, [sessionId]);

  async function resetQuestion(qId) {
    try {
      await update(ref(db, `sessions/${sessionId}`), {
        [`questions/${qId}/votes`]: null,
        [`questions/${qId}/aiGrades`]: null,
        [`questions/${qId}/revealedAt`]: null,
        [`questions/${qId}/activatedAt`]: null,
        [`questions/${qId}/revealedHints`]: 0,
        [`questions/${qId}/revealedWinners`]: 0,
        [`questions/${qId}/currentSlide`]: 0,
      });
      showToast('답변이 초기화되었습니다');
    } catch {
      setError('초기화에 실패했습니다.');
    }
  }

  async function resetAllQuestions() {
    try {
      const updates = {
        gameResult: null,
        gameState: null,
        drumroll: null,
        currentQuestion: null,
        currentMode: 'waiting',
        scores: null,
        reactions: null,
        chat: null,
        handRaises: null,
        urgentQuestions: null,
        staffChat: null,
        // classQuestions, qaStats는 세션 누적 데이터로 초기화하지 않음
      };
      questionList.forEach(([qId]) => {
        updates[`questions/${qId}/votes`] = null;
        updates[`questions/${qId}/aiGrades`] = null;
        updates[`questions/${qId}/revealedAt`] = null;
        updates[`questions/${qId}/activatedAt`] = null;
        updates[`questions/${qId}/awardedAt`] = null;
        updates[`questions/${qId}/revealedHints`] = 0;
        updates[`questions/${qId}/revealedWinners`] = 0;
        updates[`questions/${qId}/currentSlide`] = 0;
      });
      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast('모든 답변과 점수가 초기화되었습니다');

      // P1-8: 600ms 후 학생-write 영역만 다시 sweep — 인플라이트 race 잔존 방지.
      // 같은 세션에서 또 다른 reset이 일어나면 본 sweep은 폐기.
      const epoch = Date.now();
      resetEpochs.set(sessionId, epoch);
      setTimeout(() => {
        if (resetEpochs.get(sessionId) !== epoch) return;
        update(ref(db, `sessions/${sessionId}`), {
          handRaises: null,
          urgentQuestions: null,
          chat: null,
        }).catch(() => { /* sweep 실패해도 본 reset은 이미 성공 */ });
      }, 600);
    } catch {
      setError('전체 초기화에 실패했습니다.');
    }
  }

  return {
    error,
    setError,
    toast,
    showToast,
    questionList,
    handleSubmit,
    updateQuestion,
    activateQuestion,
    clearActive,
    deleteQuestion,
    duplicateQuestion,
    moveQuestion,
    reorderQuestion,
    importFromLibrary,
    revealQuiz,
    revealHint,
    revealAnswer,
    resetQuestion,
    resetAllQuestions,
    showLeaderboard,
    armEvent,
    clearPendingEvent,
  };
}
