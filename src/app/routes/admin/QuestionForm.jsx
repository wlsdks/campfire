import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Circle, Cloud, MessageSquare, Plus, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QUIZ_DEFAULTS } from '@/lib/quiz';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

const INPUT_CLASS =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';

/**
 * Form for creating a new question (type selector, title, options, correct answer for quiz).
 * Presentational component — delegates submission to parent via onSubmit callback.
 *
 * @param {Object} props
 * @param {(data: { type: string, title: string, options: string[], correctAnswer: string }) => Promise<boolean>} props.onSubmit
 * @param {() => void} props.onCancel
 * @param {string|null} props.error
 */
export default function QuestionForm({ onSubmit, onCancel, error }) {
  const [type, setType] = useState('choice');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [localError, setLocalError] = useState(null);

  const isChoiceLike = type === 'choice' || type === 'quiz';

  async function handleAdd() {
    if (!title.trim()) return;

    const cleanOptions = options.filter((option) => option.trim());

    if (isChoiceLike && cleanOptions.length < 2) {
      setLocalError('선택형 질문은 최소 2개의 선택지가 필요합니다.');
      return;
    }

    if (type === 'quiz' && !correctAnswer) {
      setLocalError('퀴즈의 정답 선택지를 지정해주세요.');
      return;
    }

    setLocalError(null);
    const success = await onSubmit({ type, title, options: cleanOptions, correctAnswer });
    if (success) {
      setTitle('');
      setOptions(['', '']);
      setCorrectAnswer('');
      onCancel();
    }
  }

  const displayError = localError || error;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {QUESTION_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                aria-label={`${t.label} 유형 선택`}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  type === t.value
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="질문 내용을 입력하세요"
          className={INPUT_CLASS}
          autoFocus
        />

        {isChoiceLike &&
          options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={(e) => {
                  const nextOptions = [...options];
                  nextOptions[i] = e.target.value;
                  setOptions(nextOptions);
                  if (correctAnswer && !nextOptions.includes(correctAnswer)) {
                    setCorrectAnswer('');
                  }
                }}
                placeholder={`선택지 ${i + 1}`}
                className={`flex-1 ${INPUT_CLASS}`}
              />
              {i === options.length - 1 && options.length < 5 && (
                <button
                  onClick={() => setOptions([...options, ''])}
                  className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all text-sm"
                  aria-label="선택지 추가"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          ))}

        {type === 'quiz' && (
          <div className="space-y-2 rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">정답 선택</p>
            <div className="flex flex-wrap gap-2">
              {options
                .filter((option) => option.trim())
                .map((option) => (
                  <button
                    key={option}
                    onClick={() => setCorrectAnswer(option)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      correctAnswer === option
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
            </div>
            <p className="text-xs text-amber-700">
              정답자: 기본 {QUIZ_DEFAULTS.points}점 + 속도 보너스, 참여자 전원 티켓{' '}
              {QUIZ_DEFAULTS.participationTickets}장, 정답자 추가 티켓 {QUIZ_DEFAULTS.correctBonusTickets}장
            </p>
          </div>
        )}

        {displayError && (
          <p className="text-red-500 text-sm flex items-center gap-1.5">{displayError}</p>
        )}

        <Button onClick={handleAdd} variant="primary" size="md" className="w-full">
          추가하기
        </Button>
      </div>
    </motion.div>
  );
}
