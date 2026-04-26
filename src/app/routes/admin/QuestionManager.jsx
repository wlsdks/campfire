import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkPlus, PanelLeftClose, Plus, Eye, RotateCcw, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import { isQuizQuestion } from '@/lib/quiz';
import { useAdminKeyboardShortcuts } from '@/hooks/useAdminKeyboardShortcuts';
import { useQuestionLibrary } from '@/features/questions/api/useQuestionLibrary';
import { useQuestionActions } from '@/hooks/useQuestionActions';
import { usePersistentAssignment } from '@/features/ai-judge/api/useLiveJudging';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { useUrgentQuestions } from '@/features/questions/api/useUrgentQuestions';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import QuickProgressCard from './QuickProgressCard';
import ImportFromLibraryModal from './ImportFromLibraryModal';
import QuestionPreview from './QuestionPreview';
import AIQuestionGenerator from '@/features/questions/components/AIQuestionGenerator';
import { isGeneratorReady } from '@/features/questions/api/generateQuestions';

function IconButton({ onClick, label, children, hoverColor = 'hover:text-slate-600 dark:hover:text-slate-300', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button onClick={onClick} className={`p-2 rounded-lg text-slate-400 dark:text-slate-500 ${hoverColor} hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 active:scale-90`} {...props}>
        {children}
      </button>
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium rounded-md whitespace-nowrap z-50 pointer-events-none"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const { saveQuestion: saveToLibrary } = useQuestionLibrary(adminUid);
  const { assignmentId: persistentAssignmentId, setAssignment: setPersistent, clearAssignment: clearPersistent } = usePersistentAssignment(sessionId);
  // P2-2: 초기화 모달에 in-flight 데이터 양 표시 — staffChat은 staff DM만 wipe(공개 chat은 별도)
  const { count: handCount } = useHandRaises(sessionId);
  const { unreadCount: urgentUnreadCount } = useUrgentQuestions(sessionId);
  const inFlightLost = [
    handCount > 0 && `손든 학생 ${handCount}명`,
    urgentUnreadCount > 0 && `읽지 않은 긴급 질문 ${urgentUnreadCount}건`,
  ].filter(Boolean);
  const resetDescription = inFlightLost.length > 0
    ? `진행 중인 데이터가 함께 사라집니다:\n• ${inFlightLost.join('\n• ')}\n\n모든 답변·점수·참여 기록을 초기화할까요? 참여자는 재접속하면 다시 표시됩니다.`
    : '모든 답변, 점수, 참여 기록을 초기화할까요? 참여자는 재접속하면 다시 표시됩니다.';

  const {
    error, toast, questionList,
    handleSubmit, activateQuestion, clearActive,
    deleteQuestion, duplicateQuestion, moveQuestion, reorderQuestion,
    importFromLibrary, revealQuiz, revealHint, revealAnswer, resetQuestion, resetAllQuestions, showLeaderboard,
  } = useQuestionActions(sessionId, questions, currentQuestion, scores, participants);

  const handleTogglePersistent = useCallback((qId) => {
    if (persistentAssignmentId === qId) clearPersistent();
    else setPersistent(qId);
  }, [persistentAssignmentId, setPersistent, clearPersistent]);

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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">질문 목록</h2>
          <div className="flex items-center gap-1">
            {questionList.length > 0 && (
              <IconButton onClick={() => setPreviewOpen(true)} label="미리보기" aria-label="문항 미리보기">
                <Eye size={18} />
              </IconButton>
            )}
            {questionList.length > 0 && !readOnly && (
              <IconButton onClick={() => setResetConfirmOpen(true)} label="초기화" aria-label="전체 답변 초기화" hoverColor="hover:text-red-500">
                <RotateCcw size={18} />
              </IconButton>
            )}
            {!readOnly && onCollapse && (
              <IconButton onClick={onCollapse} label="접기" aria-label="사이드바 접기">
                <PanelLeftClose size={18} />
              </IconButton>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!readOnly && modeButton}
          {!readOnly && adminUid && (
            <Button onClick={() => setLibraryOpen(true)} variant="secondary" size="sm">
              <BookmarkPlus size={14} /> <span className="hidden sm:inline">보관함</span>
            </Button>
          )}
          {!readOnly && isGeneratorReady() && (
            <Button onClick={() => setAiGenOpen(true)} variant="secondary" size="sm">
              <Sparkles size={14} /> <span className="hidden sm:inline">AI 생성</span>
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
        persistentAssignmentId={persistentAssignmentId}
        onTogglePersistent={!readOnly ? handleTogglePersistent : undefined}
      />

      {!readOnly && adminUid && (
        <ImportFromLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)}
          adminUid={adminUid} onImport={importFromLibrary} />
      )}

      <Toast message={toast} />

      <QuestionPreview questionList={questionList} open={previewOpen} onClose={() => setPreviewOpen(false)} />

      <AnimatePresence>
        {aiGenOpen && (
          <AIQuestionGenerator
            open={aiGenOpen}
            onClose={() => setAiGenOpen(false)}
            onUse={(draft) => importFromLibrary([draft])}
            onUseMany={(drafts) => importFromLibrary(drafts)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={resetConfirmOpen}
        onConfirm={() => { setResetConfirmOpen(false); resetAllQuestions(); }}
        onCancel={() => setResetConfirmOpen(false)}
        title="전체 답변 초기화"
        description={resetDescription}
        confirmLabel="초기화"
        variant="danger"
      />
    </div>
  );
}
