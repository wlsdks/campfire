import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { QUIZ_EVENT_PRESETS } from '@/lib/quiz';

export default function EventBooster({ nextQuizEvent, onArmEvent, onClearEvent }) {
  const [open, setOpen] = useState(false);

  function handleToggle(eventPreset) {
    if (nextQuizEvent?.id === eventPreset.id) {
      onClearEvent();
    } else {
      onArmEvent(eventPreset);
    }
  }

  const hasActive = Boolean(nextQuizEvent);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">이벤트 부스터</p>
          {hasActive && (
            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {nextQuizEvent.label}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {QUIZ_EVENT_PRESETS.map((preset) => {
                const isSelected = nextQuizEvent?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleToggle(preset)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {preset.label}
                    </p>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
