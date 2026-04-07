import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookmarkPlus, PanelLeftClose, Plus, Eye, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { isQuizQuestion } from '@/lib/quiz';
import { useAdminKeyboardShortcuts } from '@/hooks/useAdminKeyboardShortcuts';
import { useQuestionLibrary } from '@/features/questions/api/useQuestionLibrary';
import { useQuestionActions } from '@/hooks/useQuestionActions';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import QuickProgressCard from './QuickProgressCard';
import ImportFromLibraryModal from './ImportFromLibraryModal';
import QuestionPreview from './QuestionPreview';

export default function QuestionManager({
  sessionId,
  questions,
  currentQuestion,
  scores = {},
  participants = {},
  onAddClick,
  onEditClick,
  onCollapse,
  readOnly = false,
  onViewQuestion,
  formOpen = false,
  adminUid,
  speedQuizActive = false,
  onStartSpeedQuiz,
  onEndSpeedQuiz,
  speedQuizCount = 0,
  modeSlot = null,
  modeButton = null,
  mobileStickyProgress = false,
}) {
  const [showForm, setShowForm] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { saveQuestion: saveToLibrary } = useQuestionLibrary(adminUid);

  const {
    error, toast, questionList,
    handleSubmit, activateQuestion, clearActive,
    deleteQuestion, duplicateQuestion, moveQuestion, reorderQuestion,
    importFromLibrary, revealQuiz, revealHint, revealAnswer, resetQuestion, resetAllQuestions, showLeaderboard,
  } = useQuestionActions(sessionId, questions, currentQuestion, scores, participants);

  const activeIndex = questionList.findIndex(([qId]) => qId === currentQuestion);
  const currentEntry = activeIndex >= 0 ? questionList[activeIndex] : null;
  const nextEntry = activeIndex >= 0 ? questionList[activeIndex + 1] : questionList[0];

  const completedCount = questionList.filter(([, q]) => q.activatedAt || q.revealedAt).length;
  const handleActivate = useCallback((qId) => activateQuestion(qId), [activateQuestion]);
  const handleNextEvent = useCallback(() => {}, []);

  async function handleSaveToLibrary(qId) {
    const question = questions?.[qId];
    if (!question || !adminUid) return;
    const { votes: _v, activatedAt: _a, revealedAt: _r, awardedAt: _aw, event: _e, order: _o, ...rest } = question;
    await saveToLibrary(rest);
  }

  // Keyboard shortcuts for quick session control
  const shortcutsEnabled = !readOnly && !formOpen && !showForm && questionList.length > 0;
  useAdminKeyboardShortcuts({
    enabled: shortcutsEnabled,
    questionList,
    currentQuestion,
    onActivate: handleActivate,
    onReveal: revealQuiz,
    onShowLeaderboard: showLeaderboard,
    onClearActive: clearActive,
    isQuizFn: isQuizQuestion,
  });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">질문 목록</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!readOnly && modeButton}
          {!readOnly && adminUid && (
            <Button onClick={() => setLibraryOpen(true)} variant="secondary" size="sm">
              <BookmarkPlus size={14} /> <span className="hidden sm:inline">보관함</span>
            </Button>
          )}
          {!readOnly && (
            <Button
              onClick={() => { if (onAddClick) { onAddClick(); } else { setShowForm(!showForm); } }}
              variant={showForm && !onAddClick ? 'ghost' : 'primary'}
              size="sm"
            >
              {showForm && !onAddClick ? '취소' : <><Plus size={14} /> 추가</>}
            </Button>
          )}
          {questionList.length > 0 && (
            <>
              <button onClick={() => setPreviewOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90"
                title="미리보기" aria-label="문항 미리보기">
                <Eye size={16} />
              </button>
              {!readOnly && (
                <button onClick={() => { if (confirm('모든 문항의 답변을 초기화할까요?')) resetAllQuestions(); }}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90"
                  title="전체 답변 초기화" aria-label="전체 답변 초기화">
                  <RotateCcw size={16} />
                </button>
              )}
            </>
          )}
          {!readOnly && onCollapse && (
            <button onClick={onCollapse}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90"
              title="패널 접기" aria-label="사이드바 접기">
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
      </div>

      {questionList.length > 0 && !readOnly && (
        <div className={mobileStickyProgress ? 'sticky top-0 z-10 -mx-5 px-5 pt-3 pb-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sm:static sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0 sm:bg-transparent sm:border-none' : ''}>
          <QuickProgressCard
            questionList={questionList}
            activeIndex={activeIndex}
            currentEntry={currentEntry}
            nextEntry={nextEntry}
            onActivate={handleActivate}
            onClearActive={clearActive}
            onReveal={revealQuiz}
            onRevealHint={revealHint}
            onRevealAnswer={revealAnswer}
            onShowLeaderboard={showLeaderboard}
            onNextEvent={handleNextEvent}
            speedQuizActive={speedQuizActive}
            onStartSpeedQuiz={onStartSpeedQuiz}
            onEndSpeedQuiz={onEndSpeedQuiz}
            speedQuizCount={speedQuizCount}
          />
        </div>
      )}

      {questionList.length > 0 && readOnly && (
        <button
          onClick={() => onViewQuestion?.('__summary__')}
          className={`w-full rounded-xl border bg-white dark:bg-slate-800 p-3 space-y-1 shadow-sm text-left transition-colors duration-150 active:scale-[0.98] ${
            !currentQuestion ? 'border-slate-400 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">수업 요약</p>
          <p className="text-slate-900 dark:text-slate-100 text-sm font-medium">
            질문 {questionList.length}개 · {completedCount}개 진행 완료
          </p>
        </button>
      )}

      {modeSlot}

      {!readOnly && (
        <AnimatePresence>
          {showForm && !onAddClick && (
            <QuestionForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} error={error} />
          )}
        </AnimatePresence>
      )}

      <QuestionList
        questionList={questionList} currentQuestion={currentQuestion}
        onActivate={handleActivate} onReveal={revealQuiz} onRevealAnswer={revealAnswer} onShowLeaderboard={showLeaderboard}
        onClearActive={clearActive} onEdit={!readOnly ? (onEditClick || undefined) : undefined}
        onDuplicate={duplicateQuestion} onDelete={deleteQuestion}
        onReorder={reorderQuestion}
        onMoveUp={(qId) => moveQuestion(qId, 'up')} onMoveDown={(qId) => moveQuestion(qId, 'down')}
        readOnly={readOnly} onView={readOnly ? onViewQuestion : undefined}
        onSaveToLibrary={!readOnly && adminUid ? handleSaveToLibrary : undefined}
      />

      {!readOnly && adminUid && (
        <ImportFromLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)}
          adminUid={adminUid} onImport={importFromLibrary} />
      )}

      <Toast message={toast} />

      <QuestionPreview questionList={questionList} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
