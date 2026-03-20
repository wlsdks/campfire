import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateQuestionId } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { BookmarkPlus, PanelLeftClose, Play, Plus, Square, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  QUIZ_DEFAULTS,
  QUIZ_EVENT_PRESETS,
  getQuestionMode,
  getQuizReward,
  isQuizQuestion,
  normalizeQuizEvent,
} from '@/lib/quiz';
import { useAdminKeyboardShortcuts } from '@/hooks/useAdminKeyboardShortcuts';
import { useQuestionLibrary } from '@/features/questions/api/useQuestionLibrary';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import ImportFromLibraryModal from './ImportFromLibraryModal';

function KeyHint({ keys, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
      <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500 border border-slate-200 leading-none">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

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
  formOpen = false,
  adminUid,
  speedQuizActive = false,
  onStartSpeedQuiz,
  onEndSpeedQuiz,
  speedQuizCount = 0,
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { saveQuestion: saveToLibrary } = useQuestionLibrary(adminUid);
  const [nextEvent, setNextEvent] = useState(null);
  const { toast, showToast } = useToast();

  const questionList = Object.entries(questions || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  const activeIndex = questionList.findIndex(([qId]) => qId === currentQuestion);
  const currentEntry = activeIndex >= 0 ? questionList[activeIndex] : null;
  const nextEntry = activeIndex >= 0 ? questionList[activeIndex + 1] : questionList[0];
  const nextQuizEvent = normalizeQuizEvent(pendingEvent);

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
        if (nextEvent) {
          updates[`questions/${qId}/event`] = normalizeQuizEvent(nextEvent);
          setNextEvent(null);
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
      // Silently fail — Firebase will retry
    }
  }

  async function reorderQuestion(fromId, toId) {
    const fromIdx = questionList.findIndex(([id]) => id === fromId);
    const toIdx = questionList.findIndex(([id]) => id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    try {
      const updates = {};
      // Recompute all order values based on new position
      const reordered = [...questionList];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      reordered.forEach(([id], i) => {
        updates[`questions/${id}/order`] = i + 1;
      });
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
        updates[`questions/${newId}`] = {
          ...questionData,
          order: currentCount + i + 1,
        };
      });
      await update(ref(db, `sessions/${sessionId}`), updates);
      showToast(`${libraryQuestions.length}개 질문이 추가되었습니다`);
    } catch {
      setError('보관함에서 질문 가져오기에 실패했습니다.');
    }
  }

  async function handleSaveToLibrary(qId) {
    const question = questions?.[qId];
    if (!question || !adminUid) return;
    const { votes: _v, activatedAt: _a, revealedAt: _r, awardedAt: _aw, event: _e, order: _o, ...rest } = question;
    const saved = await saveToLibrary(rest);
    if (saved) {
      showToast('보관함에 저장되었습니다');
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
          // Total never goes below 0 (betting penalty can be negative)
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

  // Count completed questions for readOnly summary
  const completedCount = questionList.filter(([, q]) => q.activatedAt || q.revealedAt).length;

  // Keyboard shortcuts for quick session control
  const shortcutsEnabled = !readOnly && !formOpen && !showForm && questionList.length > 0;
  useAdminKeyboardShortcuts({
    enabled: shortcutsEnabled,
    questionList,
    currentQuestion,
    onActivate: activateQuestion,
    onReveal: revealQuiz,
    onShowLeaderboard: showLeaderboard,
    onClearActive: clearActive,
    isQuizFn: isQuizQuestion,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">질문 목록</h2>
        <div className="flex items-center gap-1.5">
          {!readOnly && adminUid && (
            <Button
              onClick={() => setLibraryOpen(true)}
              variant="ghost"
              size="sm"
            >
              <BookmarkPlus size={14} /> 보관함
            </Button>
          )}
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
              className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
              title="패널 접기"
              aria-label="사이드바 접기"
            >
              <PanelLeftClose size={36} />
            </button>
          )}
        </div>
      </div>

      {questionList.length > 0 && !readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">빠른 진행</p>
            <p className="text-slate-900 text-base font-semibold">
              {currentEntry
                ? `${activeIndex + 1}/${questionList.length}번째 질문 진행 중`
                : `질문 ${questionList.length}개 준비됨`}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {currentEntry
                ? currentEntry[1].title
                : '아직 활성화된 질문이 없습니다. 첫 질문을 바로 시작할 수 있습니다.'}
            </p>
            {currentEntry?.[1]?.type === 'quiz' && (
              <p className="text-slate-500 text-xs font-medium">
                {currentEntry[1].revealedAt
                  ? '정답 공개가 완료되었습니다. 리더보드로 이어서 보여줄 수 있습니다.'
                  : '정답 공개 전까지 답안을 모으는 중입니다.'}
              </p>
            )}
          </div>
          {/* Event toggle — shown when next question is quiz */}
          {nextEntry && isQuizQuestion(nextEntry[1]) && (
            <div className="flex flex-wrap gap-1.5">
              {QUIZ_EVENT_PRESETS.map((preset) => {
                const isSelected = nextEvent?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setNextEvent(isSelected ? null : preset)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-[0.96] ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}
          {/* Speed Quiz toggle */}
          {speedQuizCount >= 2 && (
            <div>
              {speedQuizActive ? (
                <button
                  onClick={onEndSpeedQuiz}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium transition-all active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <Zap size={14} />
                    스피드 퀴즈 진행 중
                  </span>
                  <span className="text-xs text-white/50">탭하여 중단</span>
                </button>
              ) : (
                <button
                  onClick={onStartSpeedQuiz}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-all active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <Zap size={14} className="text-slate-500" />
                    스피드 퀴즈
                  </span>
                  <span className="text-xs text-slate-400">{speedQuizCount}문제 · 10초씩</span>
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => nextEntry && activateQuestion(nextEntry[0])}
              variant="primary"
              size="sm"
              disabled={!nextEntry || speedQuizActive}
            >
              <Play size={14} />
              {currentEntry ? '다음 질문' : '첫 질문 시작'}
              {nextEvent && ' ✦'}
            </Button>
            <Button onClick={clearActive} variant="secondary" size="sm" disabled={!currentEntry || speedQuizActive}>
              <Square size={14} />
              대기 화면
            </Button>
          </div>
          {nextEntry && currentEntry && (
            <p className="text-slate-400 text-xs">
              다음 예정: <span className="text-slate-600">{nextEntry[1].title}</span>
            </p>
          )}
          {/* Keyboard shortcut hints */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <KeyHint keys="← →" label="질문 이동" />
            <KeyHint keys="Space" label="다음" />
            <KeyHint keys="Esc" label="대기" />
            {currentEntry?.[1]?.type === 'quiz' && !currentEntry[1].revealedAt && (
              <KeyHint keys="R" label="정답 공개" />
            )}
            {currentEntry?.[1]?.type === 'quiz' && currentEntry[1].revealedAt && (
              <KeyHint keys="L" label="리더보드" />
            )}
          </div>
        </div>
      )}

      {questionList.length > 0 && readOnly && (
        <button
          onClick={() => onViewQuestion?.('__summary__')}
          className={`w-full rounded-xl border bg-white p-3 space-y-1 shadow-sm text-left transition-all active:scale-[0.98] ${
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
        onReorder={reorderQuestion}
        onMoveUp={(qId) => moveQuestion(qId, 'up')}
        onMoveDown={(qId) => moveQuestion(qId, 'down')}
        readOnly={readOnly}
        onView={readOnly ? onViewQuestion : undefined}
        onSaveToLibrary={!readOnly && adminUid ? handleSaveToLibrary : undefined}
      />

      {!readOnly && adminUid && (
        <ImportFromLibraryModal
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          adminUid={adminUid}
          onImport={importFromLibrary}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
