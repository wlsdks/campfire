import { useCallback, useEffect, useRef, useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateQuestionId } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, PanelLeftClose, Play, Plus, Square } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  QUIZ_DEFAULTS,
  getQuestionMode,
  getQuizReward,
  isQuizQuestion,
  normalizeQuizEvent,
} from '@/lib/quiz';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import EventBooster from './EventBooster';

function getNow() {
  return Date.now();
}

export default function QuestionManager({
  sessionId,
  questions,
  currentQuestion,
  scores = {},
  participants = {},
  pendingEvent = null,
  onAddClick,
  onCollapse,
  readOnly = false,
  onViewQuestion,
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  const activeIndex = questionList.findIndex(([qId]) => qId === currentQuestion);
  const currentEntry = activeIndex >= 0 ? questionList[activeIndex] : null;
  const nextEntry = activeIndex >= 0 ? questionList[activeIndex + 1] : questionList[0];
  const nextQuizEvent = normalizeQuizEvent(pendingEvent);

  async function handleSubmit({ type, title, options: cleanOptions, correctAnswer }) {
    try {
      setError(null);
      const qId = generateQuestionId();
      const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
      const isChoiceLike = type === 'choice' || type === 'quiz';

      if (isChoiceLike) {
        questionData.options = cleanOptions;
        questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
      }
      if (type === 'ox') {
        questionData.correctAnswer = correctAnswer || 'O';
      }
      if (type === 'quiz') {
        questionData.points = QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
      }

      await set(ref(db, `sessions/${sessionId}/questions/${qId}`), questionData);
      return true;
    } catch {
      setError('질문 저장에 실패했습니다. 다시 시도해주세요.');
      return false;
    }
  }

  async function activateQuestion(qId) {
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
        if (nextQuizEvent) {
          updates[`questions/${qId}/event`] = nextQuizEvent;
          updates.pendingEvent = null;
        }
      }

      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast('질문이 활성화되었습니다');
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function clearActive() {
    try {
      await update(ref(db, `sessions/${sessionId}`), { currentQuestion: null, currentMode: 'waiting' });
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function deleteQuestion(qId) {
    try {
      await remove(ref(db, `sessions/${sessionId}/questions/${qId}`));
      if (currentQuestion === qId) await clearActive();
      showToast('질문이 삭제되었습니다');
    } catch {
      // Silently fail — Firebase will retry
    }
  }

  async function duplicateQuestion(qId) {
    const source = questions?.[qId];
    if (!source) return;

    try {
      setError(null);
      const newId = generateQuestionId();
      const nextOrder = questionList.length + 1;
      const {
        votes: _votes,
        activatedAt: _activatedAt,
        revealedAt: _revealedAt,
        awardedAt: _awardedAt,
        event: _event,
        ...rest
      } = source;
      await set(ref(db, `sessions/${sessionId}/questions/${newId}`), {
        ...rest,
        title: `${source.title} (복사)`,
        order: nextOrder,
      });
      showToast('질문이 복제되었습니다');
    } catch {
      setError('질문 복제에 실패했습니다. 다시 시도해주세요.');
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

          updates[`scores/${participantId}`] = {
            nickname,
            total: (existingScore.total || 0) + reward.points,
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

  // Count completed questions for readOnly summary
  const completedCount = questionList.filter(([, q]) => q.activatedAt || q.revealedAt).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">질문 목록</h2>
        <div className="flex items-center gap-1.5">
          {!readOnly && (
            <Button
              onClick={() => {
                if (onAddClick) {
                  onAddClick();
                } else {
                  setShowForm(!showForm);
                }
              }}
              variant={showForm && !onAddClick ? 'ghost' : 'primary'}
              size="sm"
            >
              {showForm && !onAddClick ? '취소' : <><Plus size={14} /> 추가</>}
            </Button>
          )}
          {!readOnly && onCollapse && (
            <button
              onClick={onCollapse}
              className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="패널 접기"
              aria-label="사이드바 접기"
            >
              <PanelLeftClose size={36} />
            </button>
          )}
        </div>
      </div>

      {questionList.length > 0 && !readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">빠른 진행</p>
            <p className="text-slate-900 text-sm font-medium">
              {currentEntry
                ? `${activeIndex + 1}/${questionList.length}번째 질문 진행 중`
                : `질문 ${questionList.length}개 준비됨`}
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              {currentEntry
                ? currentEntry[1].title
                : '아직 활성화된 질문이 없습니다. 첫 질문을 바로 시작할 수 있습니다.'}
            </p>
            {currentEntry?.[1]?.type === 'quiz' && (
              <p className="text-amber-600 text-xs font-medium">
                {currentEntry[1].revealedAt
                  ? '정답 공개가 완료되었습니다. 리더보드로 이어서 보여줄 수 있습니다.'
                  : '정답 공개 전까지 답안을 모으는 중입니다.'}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => nextEntry && activateQuestion(nextEntry[0])}
              variant="primary"
              size="sm"
              disabled={!nextEntry}
            >
              <Play size={14} />
              {currentEntry ? '다음 질문' : '첫 질문 시작'}
            </Button>
            <Button onClick={clearActive} variant="secondary" size="sm" disabled={!currentEntry}>
              <Square size={14} />
              대기 화면
            </Button>
          </div>
          {nextEntry && currentEntry && (
            <p className="text-slate-400 text-xs">
              다음 예정: <span className="text-slate-600">{nextEntry[1].title}</span>
            </p>
          )}
        </div>
      )}

      {questionList.length > 0 && readOnly && (
        <button
          onClick={() => onViewQuestion?.('__summary__')}
          className={`w-full rounded-xl border bg-white p-3 space-y-1 shadow-sm text-left transition-all ${
            !currentQuestion ? 'border-slate-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">수업 요약</p>
          <p className="text-slate-900 text-sm font-medium">
            질문 {questionList.length}개 · {completedCount}개 진행 완료
          </p>
        </button>
      )}

      {!readOnly && (
        <EventBooster
          nextQuizEvent={nextQuizEvent}
          onArmEvent={armEvent}
          onClearEvent={clearPendingEvent}
        />
      )}

      {!readOnly && (
        <AnimatePresence>
          {showForm && !onAddClick && (
            <QuestionForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              error={error}
            />
          )}
        </AnimatePresence>
      )}

      <QuestionList
        questionList={questionList}
        currentQuestion={currentQuestion}
        onActivate={activateQuestion}
        onReveal={revealQuiz}
        onShowLeaderboard={showLeaderboard}
        onClearActive={clearActive}
        onDuplicate={duplicateQuestion}
        onDelete={deleteQuestion}
        readOnly={readOnly}
        onView={readOnly ? onViewQuestion : undefined}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50"
          >
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
