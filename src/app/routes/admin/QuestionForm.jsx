import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QUIZ_DEFAULTS, QUIZ_EVENT_PRESETS } from '@/lib/quiz';
import { QUESTION_TYPES } from '@/lib/question-types';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];
const RANKING_LABELS = ['1', '2', '3', '4', '5', '6'];
const GAP = 'pt-4'; // 모든 섹션 간 동일한 간격

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-colors';

export default function QuestionForm({ onSubmit, onCancel, error }) {
  const [type, setType] = useState('choice');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState(QUIZ_DEFAULTS.points);
  const [event, setEvent] = useState(null);
  const [betting, setBetting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const isChoiceLike = type === 'choice' || type === 'quiz';
  const isRanking = type === 'ranking';
  const isFillInBlank = type === 'fillinblank';

  // For ranking: move item up/down to set correct order
  function moveRankingItem(index, direction) {
    const next = [...options];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setOptions(next);
  }

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
    if (isRanking && cleanOptions.length < 3) {
      setLocalError('순위 맞추기는 최소 3개 항목이 필요합니다.');
      return;
    }
    if (isFillInBlank && !title.includes('___')) {
      setLocalError('빈칸 위치를 ___ (밑줄 3개)로 표시해주세요.');
      return;
    }
    if (isFillInBlank && !correctAnswer.trim()) {
      setLocalError('정답을 입력해주세요.');
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
    const success = await onSubmit({ type, title, options: cleanOptions, correctAnswer, points, event, betting });
    if (success) {
      setTitle('');
      setOptions(['', '']);
      setCorrectAnswer('');
      setPoints(QUIZ_DEFAULTS.points);
      setEvent(null);
      setBetting(false);
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
    <div>
      {/* 질문 유형 */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">질문 유형</p>
        <div className="flex gap-1.5">
          {QUESTION_TYPES.map((t) => {
            const Icon = t.icon;
            const selected = type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setType(t.value);
                  setLocalError(null);
                  // Reset options count for ranking (minimum 3)
                  if (t.value === 'ranking' && options.length < 3) {
                    setOptions(['', '', '']);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-lg border transition-all active:scale-[0.96] ${
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

      {/* 질문 내용 */}
      <div className={GAP}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">질문 내용</p>
        <textarea
          value={title}
          onChange={(e) => { setTitle(e.target.value); setLocalError(null); }}
          placeholder={isFillInBlank ? 'HTTP 상태코드 ___는 페이지를 찾을 수 없음을 의미한다' : '학생들에게 보여줄 질문을 입력하세요'}
          aria-label="질문 내용"
          rows={3}
          className={`${INPUT} resize-none text-base leading-relaxed`}
          autoFocus
        />
      </div>

      {/* 선택지 */}
      <AnimatePresence>
        {isChoiceLike && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
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
                    aria-label={`선택지 ${OPTION_LABELS[i]}`}
                    className={`flex-1 ${INPUT} py-2.5`}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all active:scale-90"
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
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> 선택지 추가
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 순위 항목 (ranking) */}
      <AnimatePresence>
        {isRanking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">정답 순서</p>
              <span className="text-[11px] text-slate-300">아래 순서가 정답입니다. 화살표로 조정하세요</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {RANKING_LABELS[i]}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                      setLocalError(null);
                    }}
                    placeholder={`${i + 1}번째 항목`}
                    aria-label={`순위 ${i + 1}번째 항목`}
                    className={`flex-1 ${INPUT} py-2.5`}
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveRankingItem(i, 'up')}
                      disabled={i === 0}
                      className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-all active:scale-90"
                      aria-label="위로 이동"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveRankingItem(i, 'down')}
                      disabled={i === options.length - 1}
                      className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-all active:scale-90"
                      aria-label="아래로 이동"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  {options.length > 3 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all active:scale-90"
                      aria-label="항목 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  onClick={() => setOptions([...options, ''])}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> 항목 추가
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 빈칸 채우기 안내 & 정답 입력 */}
      <AnimatePresence>
        {isFillInBlank && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">빈칸 미리보기</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {title.includes('___')
                    ? title.split('___').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="inline-block mx-1 px-3 py-0.5 bg-slate-100 border border-dashed border-slate-300 rounded-md text-slate-400 text-xs font-medium">
                              빈칸
                            </span>
                          )}
                        </span>
                      ))
                    : <span className="text-slate-300">질문에 ___ 를 포함해주세요</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">정답</p>
                <input
                  value={correctAnswer}
                  onChange={(e) => { setCorrectAnswer(e.target.value); setLocalError(null); }}
                  placeholder="빈칸에 들어갈 정답"
                  aria-label="빈칸 정답"
                  className={`${INPUT} py-2.5`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 정답 선택 (객관식/퀴즈) */}
      <AnimatePresence>
        {isChoiceLike && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">정답 선택</p>
            <div className="flex flex-wrap gap-2">
              {options
                .filter((o) => o.trim())
                .map((option, i) => {
                  const isCorrect = correctAnswer === option;
                  return (
                    <button
                      key={option}
                      onClick={() => { setCorrectAnswer(option); setLocalError(null); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.96] flex items-center gap-1.5 ${
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* 점수 설정 (퀴즈만) */}
      <AnimatePresence>
        {type === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">점수 설정</p>
              <span className="text-[11px] text-slate-300">(+속도 보너스 최대 {QUIZ_DEFAULTS.maxSpeedBonus}점)</span>
            </div>
            <div className="flex gap-1.5">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  onClick={() => setPoints(v)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
                    points === v
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {v}점
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 이벤트 (퀴즈만) */}
      <AnimatePresence>
        {type === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">이벤트 <span className="normal-case font-normal">(선택)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {QUIZ_EVENT_PRESETS.map((preset) => {
                const isSelected = event?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setEvent(isSelected ? null : preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.96] ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 포인트 베팅 (퀴즈만) */}
      <AnimatePresence>
        {type === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">포인트 베팅</p>
                <p className="text-[11px] text-slate-300 mt-0.5">학생이 배율을 선택 (1x/2x/3x)</p>
              </div>
              <button
                onClick={() => setBetting(!betting)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  betting ? 'bg-slate-900' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={betting}
                aria-label="포인트 베팅 활성화"
              >
                <motion.div
                  animate={{ x: betting ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O/X 정답 선택 */}
      <AnimatePresence>
        {type === 'ox' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={GAP}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">정답 선택</p>
            <div className="flex gap-2">
              {['O', 'X'].map((val) => {
                const isCorrect = correctAnswer === val;
                return (
                  <button
                    key={val}
                    onClick={() => { setCorrectAnswer(val); setLocalError(null); }}
                    className={`flex-1 py-3 rounded-lg text-lg font-bold transition-all active:scale-[0.96] flex items-center justify-center gap-2 ${
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
            role="alert"
            className="text-red-500 text-sm flex items-center gap-1.5 pt-3"
          >
            <AlertCircle size={14} />
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
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
