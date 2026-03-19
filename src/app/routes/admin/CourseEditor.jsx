import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Circle, Cloud, Copy, MessageSquare, Plus, Trash2, Trophy, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCourseTemplate } from '@/features/session/api/useCourseTemplate';
import { generateQuestionId } from '@/lib/utils';
import { QUIZ_DEFAULTS } from '@/lib/quiz';
import QuestionForm from './QuestionForm';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

export default function CourseEditor({ courseId, courseName, onBack }) {
  const { template, loading, addQuestion, deleteQuestion, duplicateQuestion, swapQuestionOrder, refresh } = useCourseTemplate(courseId);
  const [showForm, setShowForm] = useState(false);
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

  const questions = template?.questions || {};
  const questionList = Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  async function handleSubmit({ type, title, options: cleanOptions, correctAnswer }) {
    const qId = generateQuestionId();
    const questionData = { type, title: title.trim(), order: Object.keys(questions).length + 1 };
    const isChoiceLike = type === 'choice' || type === 'quiz';

    if (isChoiceLike) {
      questionData.options = cleanOptions;
    }
    if (type === 'quiz') {
      questionData.correctAnswer = cleanOptions.includes(correctAnswer) ? correctAnswer : cleanOptions[0];
      questionData.points = QUIZ_DEFAULTS.points;
      questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
      questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
      questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
      questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
    }

    await addQuestion(qId, questionData);
    showToast('질문이 추가되었습니다');
    return true;
  }

  async function handleDelete(qId) {
    await deleteQuestion(qId);
    showToast('질문이 삭제되었습니다');
  }

  async function handleDuplicate(qId) {
    const source = questions[qId];
    if (!source) return;
    const newId = generateQuestionId();
    const { votes: _v, activatedAt: _a, revealedAt: _r, awardedAt: _aw, event: _e, ...rest } = source;
    await duplicateQuestion(qId, newId, {
      ...rest,
      title: `${source.title} (복사)`,
      order: questionList.length + 1,
    });
    showToast('질문이 복제되었습니다');
  }

  async function handleMove(qId, direction) {
    const idx = questionList.findIndex(([id]) => id === qId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questionList.length) return;

    const [currentId, currentQ] = questionList[idx];
    const [swapId, swapQ] = questionList[swapIdx];
    await swapQuestionOrder(currentId, currentQ.order ?? idx + 1, swapId, swapQ.order ?? swapIdx + 1);
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 transition-all active:scale-90"
            aria-label="돌아가기"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">{courseName || '강의 편집'}</h1>
            <p className="text-slate-400 text-xs">질문 템플릿 편집</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-4">
        {/* Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">질문 목록</h2>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'primary'} size="sm">
            {showForm ? '취소' : <><Plus size={14} /> 추가</>}
          </Button>
        </div>

        {/* Question form */}
        <AnimatePresence>
          {showForm && (
            <QuestionForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              error={null}
            />
          )}
        </AnimatePresence>

        {/* Question list */}
        <div className="space-y-1.5">
          {questionList.map(([qId, q], index) => {
            const qType = QUESTION_TYPES.find((t) => t.value === q.type);
            const Icon = qType?.icon || MessageSquare;

            return (
              <motion.div
                key={qId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-2">
                  {/* Reorder buttons */}
                  {questionList.length > 1 && (
                    <div className="flex flex-col shrink-0 -ml-1">
                      <button
                        onClick={() => handleMove(qId, 'up')}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-all active:scale-90 ${
                          index === 0
                            ? 'text-slate-200 cursor-default'
                            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title="위로 이동"
                        aria-label="질문 위로 이동"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMove(qId, 'down')}
                        disabled={index === questionList.length - 1}
                        className={`p-0.5 rounded transition-all active:scale-90 ${
                          index === questionList.length - 1
                            ? 'text-slate-200 cursor-default'
                            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title="아래로 이동"
                        aria-label="질문 아래로 이동"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs text-slate-400 font-mono">{index + 1}.</span>
                      <Icon size={12} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-400">{qType?.label}</span>
                    </div>
                    <span className="text-slate-700 text-sm leading-snug">{q.title}</span>
                    {q.options && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.options.map((opt, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-md ${
                              q.correctAnswer === opt
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleDuplicate(qId)}
                      className="p-1.5 rounded-md text-slate-300 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90"
                      title="복제"
                      aria-label="질문 복제"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(qId)}
                      className="p-1.5 rounded-md text-slate-300 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-90"
                      title="삭제"
                      aria-label="질문 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {questionList.length === 0 && !showForm && (
            <div className="text-center py-12 space-y-1.5">
              <BarChart3 size={24} className="text-slate-300 mx-auto" />
              <p className="text-slate-400 text-sm">아직 템플릿 질문이 없습니다</p>
              <p className="text-slate-300 text-xs">위의 + 추가 버튼으로 질문을 만드세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
            aria-live="polite"
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
