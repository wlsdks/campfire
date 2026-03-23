import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Ticket, Trophy, Swords, Gift, Dices, Coffee, X, ChevronDown, CircleDot, MessageSquare, Zap, Award } from 'lucide-react';

export default memo(function ModeSwitcher({ currentMode, isSpecialMode, totalTickets, leaderboard, modeOpen, onToggle, onSwitchMode, teamBattleActive = false }) {
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!modeOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) onToggle();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modeOpen, onToggle]);

  const modes = [
    { mode: 'roulette', label: '돌림판', icon: Target },
    { mode: 'lottery', label: totalTickets > 0 ? '보상 추첨' : '제비뽑기', icon: Ticket },
    { mode: 'prizeDraw', label: '경품 추첨', icon: Gift },
    { mode: 'slotMachine', label: '777 슬롯', icon: Dices },
    { mode: 'plinko', label: '핀볼', icon: CircleDot },
    { mode: 'breakTime', label: '쉬는 시간', icon: Coffee },
    { mode: 'qaBoard', label: 'Q&A 보드', icon: MessageSquare },
    ...(leaderboard.length > 0 ? [{ mode: 'leaderboard', label: '리더보드', icon: Trophy }] : []),
    { mode: 'teamBattle', label: teamBattleActive ? '팀 스코어보드' : '팀 대항전', icon: Swords },
    { mode: 'awards', label: '시상식', icon: Award },
  ];

  const activeLabel = modes.find(m => m.mode === currentMode)?.label;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 text-sm font-medium py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors duration-150 active:scale-[0.97] ${
          isSpecialMode
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <Zap size={14} />
        {isSpecialMode ? activeLabel : '모드'}
        <motion.div animate={{ rotate: modeOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {modeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-40 py-1.5 overflow-hidden"
          >
            {modes.map(({ mode, label, icon: Icon }) => {
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { onSwitchMode(mode); onToggle(); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-100 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
            {isSpecialMode && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button
                  onClick={() => { onSwitchMode('waiting'); onToggle(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-100"
                >
                  <X size={15} />
                  화면 종료
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
