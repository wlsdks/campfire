import { QUIZ_EVENT_PRESETS } from '@/lib/quiz';

export default function EventBooster({ nextQuizEvent, onArmEvent, onClearEvent }) {
  function handleToggle(eventPreset) {
    if (nextQuizEvent?.id === eventPreset.id) {
      onClearEvent();
    } else {
      onArmEvent(eventPreset);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">이벤트 부스터</p>

      <div className="space-y-1.5">
        {QUIZ_EVENT_PRESETS.map((preset) => {
          const isSelected = nextQuizEvent?.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleToggle(preset)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? 'border-indigo-200 bg-indigo-50/60'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                {preset.label}
              </p>
              <p className={`text-xs leading-relaxed ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
