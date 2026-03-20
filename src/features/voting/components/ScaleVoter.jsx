import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import VoteConfirm from './VoteConfirm';

/**
 * Labels at specific scale positions for orientation.
 * Kept minimal — just edge labels and center.
 */
const SCALE_LABELS = [
  { value: 0, label: '전혀' },
  { value: 50, label: '보통' },
  { value: 100, label: '매우' },
];

/** Map 0–100 to a slate gradient shade for the thumb/fill. */
function getScaleColor(value) {
  if (value <= 20) return 'bg-slate-300';
  if (value <= 40) return 'bg-slate-400';
  if (value <= 60) return 'bg-slate-500';
  if (value <= 80) return 'bg-slate-700';
  return 'bg-slate-900';
}

export default function ScaleVoter({ sessionId, questionId, disabled = false }) {
  const [value, setValue] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const trackRef = useRef(null);

  const handleSubmit = useCallback(async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      const pid = getParticipantId();
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
        value: String(value),
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Scale vote failed:', err);
      setSubmitting(false);
    }
  }, [sessionId, questionId, value, disabled, submitting]);

  if (submitted) {
    return (
      <VoteConfirm
        submittedLabel="응답 완료!"
        submittedDescription="의견이 기록되었습니다"
        waitingLabel="결과를 기다리는 중..."
        waitingDescription="강사가 결과를 공개하면 표시됩니다"
        selectedAnswer={`${value}점`}
        selectedAnswerLabel="내 응답"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
    >
      {/* Big centered value display */}
      <div className="text-center">
        <motion.p
          key={value}
          initial={{ scale: 1.15, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="text-5xl font-bold text-slate-900 tabular-nums"
        >
          {value}
        </motion.p>
        <p className="text-xs text-slate-400 mt-1">0~100 사이에서 선택하세요</p>
      </div>

      {/* Slider */}
      <div className="px-1">
        <div className="relative" ref={trackRef}>
          {/* Track background */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getScaleColor(value)}`}
              initial={{ width: '50%' }}
              animate={{ width: `${value}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>

          {/* Native range input - invisible but provides touch/mouse interaction */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            disabled={disabled}
            aria-label="의견 강도 선택"
            className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer touch-none"
            style={{ WebkitAppearance: 'none', margin: 0 }}
          />

          {/* Custom thumb indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `calc(${value}% - 10px)` }}
            initial={false}
            animate={{ left: `calc(${value}% - 10px)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className={`w-5 h-5 rounded-full ${getScaleColor(value)} ring-2 ring-white shadow-md`} />
          </motion.div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-2.5">
          {SCALE_LABELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setValue(l.value)}
              className={`text-xs font-medium transition-colors ${
                value === l.value ? 'text-slate-700' : 'text-slate-300 hover:text-slate-500'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick preset buttons for common values */}
      <div className="flex gap-1.5">
        {[0, 25, 50, 75, 100].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setValue(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
              value === v
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Submit button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={disabled || submitting}
        className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium text-base transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {submitting ? '제출 중...' : '제출하기'}
      </motion.button>
    </motion.div>
  );
}
