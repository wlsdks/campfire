import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Key, Loader2 } from 'lucide-react';
import { initGemini, getStoredApiKey, isGeminiReady } from '@/features/assignments/api/gemini';
import { useJudging } from '@/features/assignments/api/useJudging';
import Button from '@/components/ui/Button';

/**
 * JudgingPanel — 강사가 심사를 실행하고 진행률을 보는 패널.
 */
export default function JudgingPanel({ assignmentId, submissionCount }) {
  const { startJudging, isJudging, progress, abort } = useJudging(assignmentId);
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState(!isGeminiReady());

  function handleSaveKey() {
    if (!apiKey.trim()) return;
    initGemini(apiKey.trim());
    setShowKeyInput(false);
  }

  if (showKeyInput) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Key size={14} className="text-slate-400" />
          Gemini API 키
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
        />
        <p className="text-xs text-slate-400">Google AI Studio에서 발급받은 키를 입력하세요. 브라우저에만 저장됩니다.</p>
        <Button onClick={handleSaveKey} variant="primary" size="sm" disabled={!apiKey.trim()}>저장</Button>
      </div>
    );
  }

  if (isJudging && progress) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">심사 진행 중</p>
          <button onClick={abort} className="text-xs text-slate-400 hover:text-red-500 transition-colors duration-150">중단</button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">{progress.currentSubmission}</span>
            <span className="text-slate-400 tabular-nums">{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {progress.currentJudge && (
            <p className="text-xs text-slate-400">
              <Loader2 size={10} className="inline animate-spin mr-1" />
              {progress.currentJudge} 심사 중...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={startJudging}
        variant="primary"
        size="sm"
        disabled={submissionCount === 0}
      >
        <Play size={14} />
        심사 시작 ({submissionCount}건)
      </Button>
      <button
        onClick={() => setShowKeyInput(true)}
        className="p-2 rounded-lg text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors duration-150"
        title="API 키 변경"
      >
        <Key size={14} />
      </button>
    </div>
  );
}
