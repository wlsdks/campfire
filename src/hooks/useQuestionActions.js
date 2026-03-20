import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
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

function getNow() {
  return Date.now();
}

export function useQuestionActions(sessionId, questions, currentQuestion, scores, participants) {
  const [error, setError] = useState(null);
  const { toast, showToast } = useToast();

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  async function handleSubmit({ type, title, options: cleanOptions, correctAnswer, points, event, betting }) {
    try {
      setError(null);
      const qId = generateQuestionId();
      const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
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
      if (type === 'quiz') {
        questionData.points = points || QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
        if (event) questionData.event = event;
        if (betting) questionData.betting = true;
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

    try {
      const updates = {
        currentQuestion: qId,
        currentMode: getQuestionMode(question),
      };

      if (isQuizQuestion(question)) {
        updates[`questions/${qId}/activatedAt`] = getNow();
        updates[`questions/${qId}/revealedAt`] = null;
        updates[`questions/${qId}/awardedAt`] = null;
        if (nextEvent) {
          updates[`questions/${qId}/event`] = normalizeQuizEvent(nextEvent);
        }
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast('질문이 활성화되었습니다');
    } catch {
      // Silently fail
    }
  }

  async function clearActive() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
    } catch {
      // Silently fail
    }
  }

  async function deleteQuestion(qId) {
    try {
      await remove(ref(db, `sessions/${sessionId}/questions/${qId}`));
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
      const { votes: _votes, activatedAt: _activatedAt, revealedAt: _revealedAt, awardedAt: _awardedAt, event: _event, ...rest } = source;
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
      const updates = {
        currentMode: 'quiz',
        [`questions/${qId}/revealedAt`]: now,
      };

      if (!question.awardedAt) {
        updates[`questions/${qId}/awardedAt`] = now;

        voteEntries.forEach(([participantId, vote]) => {
          const reward = getQuizReward(question, vote);
          const existingScore = scores[participantId] || {};
          const nextStreak = reward.isCorrect ? (existingScore.streak || 0) + 1 : 0;
          const nickname = participants[participantId]?.nickname || vote.nickname || existingScore.nickname || `참여자 ${participantId.slice(0, 4)}`;
          const newTotal = Math.max(0, (existingScore.total || 0) + reward.points);

          updates[`scores/${participantId}`] = {
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
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
    } catch {
      setError('정답 공개와 점수 반영에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function showLeaderboard() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentMode: 'leaderboard' });
    } catch {
      setError('리더보드 전환에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function armEvent(eventPreset) {
    try {
      setError(null);
      await set(ref(db, `sessions/${sessionId}/pendingEvent`), eventPreset);
    } catch {
      setError('이벤트 예약에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async function clearPendingEvent() {
    try {
      setError(null);
      await remove(ref(db, `sessions/${sessionId}/pendingEvent`));
    } catch {
      setError('이벤트 해제에 실패했습니다. 다시 시도해주세요.');
    }
  }

  return {
    error,
    setError,
    toast,
    showToast,
    questionList,
    handleSubmit,
    activateQuestion,
    clearActive,
    deleteQuestion,
    duplicateQuestion,
    moveQuestion,
    reorderQuestion,
    importFromLibrary,
    revealQuiz,
    showLeaderboard,
    armEvent,
    clearPendingEvent,
  };
}
