import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modeGroups } from '@/lib/modes';
import BottomSheet from '@/components/ui/BottomSheet';

/* ─── Mode Picker BottomSheet (grid layout, one-tap switch) ─── */
export default function MobileModePicker({ open, onClose, currentMode, onSwitchMode, leaderboard }) {
  // 목록은 lib/modes.js 한 곳에서 온다 — 데스크톱·발표 모드와 항목이 갈리지 않게.
  const sections = modeGroups({ hasLeaderboard: leaderboard.length > 0 })
    .map((g) => ({ title: g.label, modes: g.items }));

  const allModes = sections.flatMap(s => s.modes);
  const isSpecial = allModes.some(m => m.mode === currentMode);

  function ModeButton({ mode, label, icon: Icon }) {
    const isActive = currentMode === mode;
    return (
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => { onSwitchMode(mode); onClose(); }}
        className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl text-center transition-colors duration-150 ${
          isActive
            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
        }`}
      >
        <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-xs font-medium leading-tight">{label}</span>
      </motion.button>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="모드 전환">
      <div className="space-y-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">모드 전환</h3>
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.title}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {section.modes.map(m => <ModeButton key={m.mode} {...m} />)}
            </div>
          </div>
        ))}
        {isSpecial && (
          <button
            onClick={() => { onSwitchMode('waiting'); onClose(); }}
            className="w-full py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-[15px] bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <X size={16} /> 화면 종료
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
