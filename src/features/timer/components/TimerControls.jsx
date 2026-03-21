import { useState } from 'react';
import { Timer, Play, Square } from 'lucide-react';

const PRESETS = [15, 30, 60];

export default function TimerControls({ isRunning, onStart, onStop }) {
  const [customSeconds, setCustomSeconds] = useState(30);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
        <Timer size={12} />
        타이머
      </div>

      {!isRunning ? (
        <div className="flex items-center gap-1.5">
          {PRESETS.map((sec) => (
            <button
              key={sec}
              onClick={() => onStart(sec)}
              aria-label={`${sec}초 타이머 시작`}
              className="flex-1 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors duration-150"
            >
              {sec}초
            </button>
          ))}
          <div className="flex items-center bg-slate-50 dark:bg-slate-600 rounded-lg overflow-hidden">
            <input
              type="number"
              min={5}
              max={300}
              value={customSeconds}
              onChange={(e) => setCustomSeconds(Math.max(5, Math.min(300, Number(e.target.value))))}
              className="w-12 py-1.5 bg-transparent text-slate-700 dark:text-slate-200 text-center text-xs font-medium focus:outline-none"
            />
            <button
              onClick={() => onStart(customSeconds)}
              aria-label="커스텀 타이머 시작"
              className="px-2 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors duration-150"
            >
              <Play size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onStop}
          aria-label="타이머 중지"
          className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors flex items-center justify-center gap-1.5"
        >
          <Square size={12} />
          타이머 중지
        </button>
      )}
    </div>
  );
}
