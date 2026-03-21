import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Ticket, Trophy, Swords, Gift, X, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

export default memo(function ModeSwitcher({ currentMode, isSpecialMode, totalTickets, leaderboard, modeOpen, onToggle, onSwitchMode, teamBattleActive = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (modeOpen && containerRef.current) {
      setTimeout(() => {
        // Scroll parent container to absolute bottom
        const scrollParent = containerRef.current.closest('[class*="overflow-y"]') || containerRef.current.parentElement;
        if (scrollParent) {
          scrollParent.scrollTo({ top: scrollParent.scrollHeight, behavior: 'smooth' });
        }
      }, 250);
    }
  }, [modeOpen]);

  return (
    <div ref={containerRef} className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">모드 전환</p>
          {isSpecialMode && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {currentMode === 'roulette' ? '돌림판' : currentMode === 'lottery' ? '제비뽑기' : currentMode === 'prizeDraw' ? '경품 추첨' : currentMode === 'teamBattle' ? '팀 스코어보드' : '리더보드'}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: modeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {modeOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {[
                { mode: 'roulette', label: '돌림판', icon: Target },
                { mode: 'lottery', label: totalTickets > 0 ? '보상 추첨' : '제비뽑기', icon: Ticket },
                { mode: 'prizeDraw', label: '경품 추첨', icon: Gift },
                ...(leaderboard.length > 0 ? [{ mode: 'leaderboard', label: '리더보드', icon: Trophy }] : []),
                ...(teamBattleActive ? [{ mode: 'teamBattle', label: '팀 스코어보드', icon: Swords }] : []),
              ].map(({ mode, label, icon: Icon }) => {
                const isActive = currentMode === mode;
                return isActive ? (
                  <button
                    key={mode}
                    onClick={() => onSwitchMode(mode)}
                    className="w-full inline-flex items-center gap-1.5 py-1.5 px-3 text-sm font-medium rounded-lg bg-slate-900 text-white transition-colors duration-150 active:scale-[0.97]"
                    aria-label={`${label} 모드로 전환`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ) : (
                  <Button
                    key={mode}
                    onClick={() => onSwitchMode(mode)}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    aria-label={`${label} 모드로 전환`}
                  >
                    <Icon size={16} /> {label}
                  </Button>
                );
              })}
              {isSpecialMode && (
                <Button
                  onClick={() => onSwitchMode('waiting')}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  aria-label="특수 화면 종료"
                >
                  <X size={16} /> 화면 종료
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
