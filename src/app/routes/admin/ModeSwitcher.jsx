import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Ticket, Trophy, X, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

export default memo(function ModeSwitcher({ currentMode, isSpecialMode, totalTickets, leaderboard, modeOpen, onToggle, onSwitchMode }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-slate-500 text-sm font-semibold">모드 전환</p>
          {isSpecialMode && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {currentMode === 'roulette' ? '돌림판' : currentMode === 'lottery' ? '제비뽑기' : '리더보드'}
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
                ...(leaderboard.length > 0 ? [{ mode: 'leaderboard', label: '리더보드', icon: Trophy }] : []),
              ].map(({ mode, label, icon: Icon }) => {
                const isActive = currentMode === mode;
                return isActive ? (
                  <button
                    key={mode}
                    onClick={() => onSwitchMode(mode)}
                    className="w-full inline-flex items-center gap-1.5 py-1.5 px-3 text-sm font-medium rounded-lg bg-slate-900 text-white transition-all active:scale-[0.97]"
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
