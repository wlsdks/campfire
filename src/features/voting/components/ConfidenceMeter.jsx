import { useState, memo } from 'react';
import { motion } from 'framer-motion';

const LEVELS = [
  { key: 'low', label: '확신 없음' },
  { key: 'medium', label: '보통' },
  { key: 'high', label: '확신' },
];

export default memo(function ConfidenceMeter({ onConfirm }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(level) {
    if (selected) return;
    setSelected(level);
    setTimeout(() => onConfirm(level), 300);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
    >
      <p className="text-xs text-slate-500 text-center mb-3">얼마나 확신하나요?</p>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            disabled={selected !== null}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
              selected === key
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            } ${selected !== null && selected !== key ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
});
