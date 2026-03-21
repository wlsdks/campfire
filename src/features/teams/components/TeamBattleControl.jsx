import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, Swords, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export default memo(function TeamBattleControl({
  isActive,
  teamCount,
  participantCount,
  onStart,
  onEnd,
}) {
  const [open, setOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(2);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && containerRef.current) {
      setTimeout(() => containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
    }
  }, [open]);

  const canStart = participantCount >= 4;

  return (
    <div ref={containerRef} className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-slate-400" />
          <p className="text-slate-500 text-sm font-semibold">팀 대항전</p>
          {isActive && (
            <span className="text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-1.5 py-0.5 rounded">
              {teamCount}팀 진행중
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
            <div className="px-4 pb-4 space-y-3">
              {!isActive ? (
                <>
                  <p className="text-xs text-slate-400">
                    참여자를 팀으로 자동 배정하고 팀별 점수를 경쟁합니다.
                    퀴즈 점수가 팀 점수에 합산됩니다.
                  </p>

                  {/* Team count selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">팀 수</label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSelectedCount(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 active:scale-[0.96] ${
                            selectedCount === n
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {n}팀
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Participant info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users size={12} />
                    <span>현재 {participantCount}명 접속 중</span>
                    {!canStart && <span className="text-red-400">(최소 4명 필요)</span>}
                  </div>

                  <Button
                    onClick={() => onStart(selectedCount)}
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!canStart}
                  >
                    <Swords size={16} />
                    팀 배정 시작
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    팀 대항전 진행 중입니다. 모드 전환에서 팀 스코어보드를 확인하세요.
                  </p>
                  <Button
                    onClick={onEnd}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <X size={16} />
                    팀 대항전 종료
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
