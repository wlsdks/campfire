import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Play, Plus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import HintReveal from './HintReveal';

/**
 * HintRevealSetup — 힌트 입력 → 실행 화면.
 * 프레젠터 화면 전용 (Firebase 저장 없이 로컬 상태).
 */
export default function HintRevealSetup() {
  const [started, setStarted] = useState(false);
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState(['', '']);

  function addHint() {
    if (hints.length < 5) setHints(prev => [...prev, '']);
  }

  function removeHint(index) {
    if (hints.length > 1) setHints(prev => prev.filter((_, i) => i !== index));
  }

  function updateHint(index, value) {
    setHints(prev => prev.map((h, i) => i === index ? value : h));
  }

  const validHints = hints.map(h => h.trim()).filter(Boolean);

  if (started && answer.trim() && validHints.length > 0) {
    return <HintReveal hints={validHints} answer={answer.trim()} title={title.trim()} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
      >
        <Lightbulb size={32} className="text-slate-400" />
      </motion.div>

      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">힌트 퀴즈</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center">힌트를 하나씩 공개하고<br />정답 보기를 누르면 폭죽과 함께 정답이 나타납니다</p>

      <div className="w-full space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">타이틀 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="이 사람은 누구일까요?"
            maxLength={50}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">정답 (필수)</label>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="정답을 입력하세요"
            maxLength={50}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">힌트 (최소 1개, 최대 5개)</label>
            {hints.length < 5 && (
              <button
                onClick={addHint}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 transition-colors duration-150"
              >
                <Plus size={12} /> 추가
              </button>
            )}
          </div>
          <div className="space-y-2">
            {hints.map((hint, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={hint}
                  onChange={e => updateHint(i, e.target.value)}
                  placeholder={`힌트 ${i + 1}`}
                  maxLength={100}
                  className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors duration-150"
                />
                {hints.length > 1 && (
                  <button
                    onClick={() => removeHint(i)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={() => setStarted(true)} variant="primary" size="lg" disabled={!answer.trim() || validHints.length === 0}>
        <Play size={18} />
        시작
      </Button>
    </div>
  );
}
