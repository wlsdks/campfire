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
              className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-medium transition-colors"
            >
              {sec}초
            </button>
          ))}
          <div className="flex items-center bg-slate-50 rounded-lg overflow-hidden">
            <input
              type="number"
              min={5}
              max={300}
              value={customSeconds}
              onChange={(e) => setCustomSeconds(Math.max(5, Math.min(300, Number(e.target.value))))}
              className="w-12 py-1.5 bg-transparent text-slate-700 text-center text-xs font-medium focus:outline-none"
            />
            <button
              onClick={() => onStart(customSeconds)}
              aria-label="커스텀 타이머 시작"
              className="px-2 py-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Play size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onStop}
          aria-label="타이머 중지"
          className="w-full py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Square size={12} />
          타이머 중지
        </button>
      )}
    </div>
  );
}
