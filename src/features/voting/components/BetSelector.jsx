import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BET_OPTIONS } from '@/lib/quiz';
import { Shield, Target, Flame } from 'lucide-react';

const BET_ICONS = [Shield, Target, Flame];
const BET_DESCRIPTIONS = [
  '패널티 없이 기본 점수',
  '정답 2배, 오답 -30점',
  '정답 3배, 오답 -60점',
];

export default function BetSelector({ onSelect }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(multiplier) {
    setSelected(multiplier);
    // Brief delay so the user sees the selection before proceeding
    setTimeout(() => onSelect(multiplier), 300);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full space-y-4"
    >
      <div className="text-center space-y-1">
        <p className="text-lg font-bold text-slate-900">포인트 베팅</p>
        <p className="text-sm text-slate-400">자신감에 따라 배율을 선택하세요</p>
      </div>

      <div className="space-y-2.5">
        {BET_OPTIONS.map((option, index) => {
          const Icon = BET_ICONS[index];
          const isSelected = selected === option.multiplier;
          const isDisabled = selected !== null && !isSelected;

          return (
            <motion.button
              key={option.multiplier}
              initial={{ opacity: 0, x: -12 }}
              animate={{
                opacity: isDisabled ? 0.3 : 1,
                x: 0,
                scale: isSelected ? 0.97 : 1,
              }}
              transition={{
                delay: index * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(option.multiplier)}
              disabled={selected !== null}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              } ${isDisabled ? 'cursor-not-allowed' : ''}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-white/15' : 'bg-slate-100'
              }`}>
                <Icon size={20} className={isSelected ? 'text-white' : 'text-slate-500'} />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{option.multiplier}x</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                    {option.label}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/50' : 'text-slate-300'}`}>
                  {BET_DESCRIPTIONS[index]}
                </p>
              </div>

              <span className={`text-2xl font-bold shrink-0 ${
                isSelected ? 'text-white' : 'text-slate-200'
              }`}>
                {option.multiplier}x
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
