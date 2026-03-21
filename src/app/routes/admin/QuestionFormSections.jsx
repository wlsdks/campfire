import { motion } from 'framer-motion';
import { Plus, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { QUIZ_DEFAULTS, QUIZ_EVENT_PRESETS } from '@/lib/quiz';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];
const RANKING_LABELS = ['1', '2', '3', '4', '5', '6'];
const GAP = 'pt-4';
const INPUT = 'w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors duration-150';

export function ChoiceOptionsSection({ options, setOptions, correctAnswer, setCorrectAnswer, setLocalError }) {
  function removeOption(index) {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    if (correctAnswer && !next.includes(correctAnswer)) setCorrectAnswer('');
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} className={GAP}>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">선택지</p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-3 space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-base font-bold text-slate-500 dark:text-slate-300 shrink-0">
              {OPTION_LABELS[i]}
            </span>
            <input value={opt}
              onChange={(e) => {
                const next = [...options]; next[i] = e.target.value; setOptions(next);
                if (correctAnswer && !next.includes(correctAnswer)) setCorrectAnswer('');
                setLocalError(null);
              }}
              placeholder={`선택지 ${OPTION_LABELS[i]}`} aria-label={`선택지 ${OPTION_LABELS[i]}`}
              className={`flex-1 ${INPUT} py-2.5`} />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)}
                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors duration-150 active:scale-90"
                aria-label="선택지 삭제"><Trash2 size={14} /></button>
            )}
          </div>
        ))}
        {options.length < 5 && (
          <button onClick={() => setOptions([...options, ''])}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 text-sm hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5">
            <Plus size={14} /> 선택지 추가
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function CorrectAnswerSection({ options, correctAnswer, setCorrectAnswer, setLocalError }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} className={GAP}>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">정답 선택</p>
      <div className="flex flex-wrap gap-2">
        {options.filter((o) => o.trim()).map((option, i) => {
          const isCorrect = correctAnswer === option;
          return (
            <button key={option} onClick={() => { setCorrectAnswer(option); setLocalError(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 active:scale-[0.96] flex items-center gap-1.5 ${
                isCorrect ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
              {isCorrect && <Check size={14} />}
              <span className="font-bold">{OPTION_LABELS[i]}</span>{option}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function RankingOptionsSection({ options, setOptions, setLocalError }) {
  function moveRankingItem(index, direction) {
    const next = [...options];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setOptions(next);
  }

  function removeOption(index) {
    if (options.length <= 3) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} className={GAP}>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">정답 순서</p>
        <span className="text-[11px] text-slate-400">아래 순서가 정답입니다. 화살표로 조정하세요</span>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-3 space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300 shrink-0">
              {RANKING_LABELS[i]}
            </span>
            <input value={opt}
              onChange={(e) => { const next = [...options]; next[i] = e.target.value; setOptions(next); setLocalError(null); }}
              placeholder={`${i + 1}번째 항목`} aria-label={`순위 ${i + 1}번째 항목`}
              className={`flex-1 ${INPUT} py-2.5`} />
            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => moveRankingItem(i, 'up')} disabled={i === 0}
                className="p-1 rounded text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors duration-150 active:scale-90"
                aria-label="위로 이동"><ArrowUp size={12} /></button>
              <button onClick={() => moveRankingItem(i, 'down')} disabled={i === options.length - 1}
                className="p-1 rounded text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors duration-150 active:scale-90"
                aria-label="아래로 이동"><ArrowDown size={12} /></button>
            </div>
            {options.length > 3 && (
              <button onClick={() => removeOption(i)}
                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors duration-150 active:scale-90"
                aria-label="항목 삭제"><Trash2 size={14} /></button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button onClick={() => setOptions([...options, ''])}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 text-sm hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5">
            <Plus size={14} /> 항목 추가
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function FillBlankSection({ title, correctAnswer, setCorrectAnswer, setLocalError }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} className={GAP}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-3 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">빈칸 미리보기</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {title.includes('___')
              ? title.split('___').map((part, i, arr) => (
                  <span key={i}>{part}
                    {i < arr.length - 1 && (
                      <span className="inline-block mx-1 px-3 py-0.5 bg-slate-100 dark:bg-slate-600 border border-dashed border-slate-300 dark:border-slate-500 rounded-md text-slate-400 text-xs font-medium">빈칸</span>
                    )}
                  </span>
                ))
              : <span className="text-slate-400">질문에 ___ 를 포함해주세요</span>}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">정답</p>
          <input value={correctAnswer}
            onChange={(e) => { setCorrectAnswer(e.target.value); setLocalError(null); }}
            placeholder="빈칸에 들어갈 정답" aria-label="빈칸 정답"
            className={`${INPUT} py-2.5`} />
        </div>
      </div>
    </motion.div>
  );
}

export function OXAnswerSection({ correctAnswer, setCorrectAnswer, setLocalError }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} className={GAP}>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">정답 선택</p>
      <div className="flex gap-2">
        {['O', 'X'].map((val) => {
          const isCorrect = correctAnswer === val;
          return (
            <button key={val} onClick={() => { setCorrectAnswer(val); setLocalError(null); }}
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition-colors duration-150 active:scale-[0.96] flex items-center justify-center gap-2 ${
                isCorrect ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
              {isCorrect && <Check size={16} />}{val}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function QuizSettingsSection({ points, setPoints, event, setEvent, betting, setBetting }) {
  return (
    <>
      {/* 점수 설정 */}
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }} className={GAP}>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">점수 설정</p>
          <span className="text-[11px] text-slate-400">(+속도 보너스 최대 {QUIZ_DEFAULTS.maxSpeedBonus}점)</span>
        </div>
        <div className="flex gap-1.5">
          {[50, 100, 200, 500].map((v) => (
            <button key={v} onClick={() => setPoints(v)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 active:scale-[0.96] ${
                points === v ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
              {v}점
            </button>
          ))}
        </div>
      </motion.div>

      {/* 이벤트 */}
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }} className={GAP}>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">이벤트 <span className="normal-case font-normal">(선택)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {QUIZ_EVENT_PRESETS.map((preset) => {
            const isSelected = event?.id === preset.id;
            return (
              <button key={preset.id} onClick={() => setEvent(isSelected ? null : preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.96] ${
                  isSelected ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                {preset.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 포인트 베팅 */}
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }} className={GAP}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">포인트 베팅</p>
            <p className="text-[11px] text-slate-400 mt-0.5">학생이 배율을 선택 (1x/2x/3x)</p>
          </div>
          <button onClick={() => setBetting(!betting)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-150 ${betting ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-600'}`}
            role="switch" aria-checked={betting} aria-label="포인트 베팅 활성화">
            <motion.div animate={{ x: betting ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
