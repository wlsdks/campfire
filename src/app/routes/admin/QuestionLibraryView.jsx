import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageSquare, Plus, Trash2, Search, X } from 'lucide-react';
import { useQuestionLibrary } from '@/features/questions/api/useQuestionLibrary';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PickMascot from '@/components/ui/PickMascot';
import Toast from '@/components/ui/Toast';
import QuestionForm from './QuestionForm';
import TemplatePacks from './TemplatePacks';
import { QUIZ_DEFAULTS } from '@/lib/quiz';
import { QUESTION_TYPES } from '@/lib/question-types';
import { useToast } from '@/hooks/useToast';

const TYPE_FILTERS = [
  { value: 'all', label: '전체' },
  ...QUESTION_TYPES,
];

function LibraryQuestionCard({ question, onDelete, index }) {
  const qType = QUESTION_TYPES.find((t) => t.value === question.type);
  const Icon = qType?.icon || MessageSquare;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-400">{qType?.label}</span>
            {question.tag && (
              <span className="text-[11px] px-1.5 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-600">
                {question.tag}
              </span>
            )}
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{question.title}</p>
          {question.options && (
            <div className="flex flex-wrap gap-1 mt-2">
              {question.options.map((opt, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-md ${
                    question.correctAnswer === opt
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
          {question.type === 'ox' && question.correctAnswer && (
            <div className="flex gap-1.5 mt-2">
              {['O', 'X'].map((v) => (
                <span
                  key={v}
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                    question.correctAnswer === v
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(question.id)}
          className="p-1.5 rounded-lg text-slate-200 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          title="삭제"
          aria-label="질문 삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default memo(function QuestionLibraryView({ adminUid }) {
  const { questions, loading, saveQuestion, deleteQuestion } = useQuestionLibrary(adminUid);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast, showToast } = useToast();

  const filtered = questions.filter((q) => {
    if (typeFilter !== 'all' && q.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const inTitle = q.title?.toLowerCase().includes(query);
      const inOptions = q.options?.some((o) => o.toLowerCase().includes(query));
      const inTag = q.tag?.toLowerCase().includes(query);
      if (!inTitle && !inOptions && !inTag) return false;
    }
    return true;
  });

  async function handleSubmit({ type, title, options: cleanOptions, correctAnswer, points }) {
    const questionData = { type, title: title.trim() };
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
    }

    const qId = await saveQuestion(questionData);
    if (qId) {
      showToast('질문이 보관함에 저장되었습니다');
      return true;
    }
    return false;
  }

  async function handleImportPack(packQuestions) {
    let count = 0;
    for (const q of packQuestions) {
      const questionData = { type: q.type, title: q.title };
      if (q.options) questionData.options = q.options;
      if (q.correctAnswer) questionData.correctAnswer = q.correctAnswer;
      if (q.type === 'quiz') {
        questionData.points = q.points || QUIZ_DEFAULTS.points;
        questionData.participationTickets = QUIZ_DEFAULTS.participationTickets;
        questionData.correctBonusTickets = QUIZ_DEFAULTS.correctBonusTickets;
        questionData.speedWindowMs = QUIZ_DEFAULTS.speedWindowMs;
        questionData.maxSpeedBonus = QUIZ_DEFAULTS.maxSpeedBonus;
      }
      const id = await saveQuestion(questionData);
      if (id) count++;
    }
    if (count > 0) showToast(`${count}개 질문이 보관함에 추가되었습니다`);
  }

  async function handleDelete(qId) {
    const ok = await deleteQuestion(qId);
    if (ok) showToast('질문이 삭제되었습니다');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">질문 보관함</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {questions.length > 0 ? `${questions.length}개의 질문이 저장됨` : '자주 쓰는 질문을 저장하세요'}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'ghost' : 'primary'}
          size="sm"
        >
          {showForm ? '취소' : <><Plus size={14} /> 새 질문</>}
        </Button>
      </div>

      {/* New question form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <QuestionForm
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
                error={null}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filter — right below header, before content */}
      {questions.length > 0 && (
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="질문 검색..."
              aria-label="질문 검색"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150"
                aria-label="검색어 지우기"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type filter — horizontally scrollable */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {TYPE_FILTERS.map((f) => {
              const isSelected = typeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question list */}
      {questions.length === 0 && !showForm ? (
        <EmptyState
          title="저장된 질문이 없습니다"
          description="자주 사용하는 질문을 보관함에 저장해두면 클래스에 바로 추가할 수 있습니다"
          steps={[
            '위의 "새 질문" 버튼으로 질문을 만드세요',
            '세션에서 사용한 질문도 여기에 저장할 수 있습니다',
            '보관함의 질문은 언제든 클래스에 추가할 수 있습니다',
          ]}
          mascotSize="md"
          mood="thinking"
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((q, i) => (
              <LibraryQuestionCard
                key={q.id}
                question={q}
                onDelete={handleDelete}
                index={i}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center py-10 space-y-2"
            >
              <PickMascot size="sm" mood="waiting" />
              <p className="text-slate-400 text-sm">일치하는 질문이 없습니다</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">검색어나 필터를 변경해보세요</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Template packs — at the bottom */}
      <TemplatePacks onImportPack={handleImportPack} />

      <Toast message={toast} />
    </div>
  );
});
