import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Circle, Cloud, MessageSquare, Plus, Trophy, Trash2, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QUIZ_DEFAULTS } from '@/lib/quiz';

const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-colors';

export default function QuestionForm({ onSubmit, onCancel, error }) {
  const [type, setType] = useState('choice');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState(QUIZ_DEFAULTS.points);
  const [localError, setLocalError] = useState(null);

  const isChoiceLike = type === 'choice' || type === 'quiz';

  async function handleAdd() {
    if (!title.trim()) {
      setLocalError('질문 내용을 입력해주세요.');
      return;
    }
    const cleanOptions = options.filter((o) => o.trim());
    if (isChoiceLike && cleanOptions.length < 2) {
      setLocalError('최소 2개의 선택지가 필요합니다.');
      return;
    }
    if ((type === 'quiz' || type === 'choice') && !correctAnswer) {
      setLocalError('정답을 선택해주세요.');
      return;
    }
    if (type === 'ox' && !correctAnswer) {
      setLocalError('정답을 선택해주세요.');
      return;
    }
    setLocalError(null);
    const success = await onSubmit({ type, title, options: cleanOptions, correctAnswer, points });
    if (success) {
      setTitle('');
      setOptions(['', '']);
      setCorrectAnswer('');
      onCancel();
    }
  }

  function removeOption(index) {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    if (correctAnswer && !next.includes(correctAnswer)) setCorrectAnswer('');
  }

  const displayError = localError || error;

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">질문 유형</p>
        <div className="flex gap-1.5">
          {QUESTION_TYPES.map((t) => {
            const Icon = t.icon;
            const selected = type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setType(t.value); setLocalError(null); }}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-lg border transition-all ${
                  selected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <Icon size={22} strokeWidth={selected ? 2 : 1.6} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">질문 내용</p>
        <textarea
          value={title}
          onChange={(e) => { setTitle(e.target.value); setLocalError(null); }}
          placeholder="학생들에게 보여줄 질문을 입력하세요"
          rows={3}
          className={`${INPUT} resize-none text-base leading-relaxed`}
          autoFocus
        />
      </div>

      {/* Options */}
      <AnimatePresence>
        {isChoiceLike && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">선택지</p>
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-500 shrink-0">
                    {OPTION_LABELS[i]}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                      if (correctAnswer && !next.includes(correctAnswer)) setCorrectAnswer('');
                      setLocalError(null);
                    }}
                    placeholder={`선택지 ${OPTION_LABELS[i]}`}
                    className={`flex-1 ${INPUT} py-2.5`}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="선택지 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button
                  onClick={() => setOptions([...options, ''])}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> 선택지 추가
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct answer for choice-like types */}
      <AnimatePresence>
        {isChoiceLike && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">정답 선택</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {options
                .filter((o) => o.trim())
                .map((option, i) => {
                  const isCorrect = correctAnswer === option;
                  return (
                    <button
                      key={option}
                      onClick={() => { setCorrectAnswer(option); setLocalError(null); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isCorrect
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isCorrect && <Check size={14} />}
                      <span className="font-bold">{OPTION_LABELS[i]}</span>
                      {option}
                    </button>
                  );
                })}
            </div>
            {type === 'quiz' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">점수 설정</p>
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setPoints(v)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        points === v
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {v}점
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  정답 {points}점 + 속도 보너스 최대 {QUIZ_DEFAULTS.maxSpeedBonus}점
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* O/X correct answer */}
      <AnimatePresence>
        {type === 'ox' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">정답 선택</p>
            <div className="flex gap-2">
              {['O', 'X'].map((val) => {
                const isCorrect = correctAnswer === val;
                return (
                  <button
                    key={val}
                    onClick={() => { setCorrectAnswer(val); setLocalError(null); }}
                    className={`flex-1 py-3 rounded-lg text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                      isCorrect
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isCorrect && <Check size={16} />}
                    {val}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {displayError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-red-500 text-sm flex items-center gap-1.5"
          >
            <AlertCircle size={14} />
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button onClick={onCancel} variant="secondary" size="md" className="flex-1">
          취소
        </Button>
        <Button onClick={handleAdd} variant="primary" size="md" className="flex-[2]">
          추가하기
        </Button>
      </div>
    </div>
  );
}
