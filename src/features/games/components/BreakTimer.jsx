import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import BreakMascot from './BreakMascot';
import FlipClock from './FlipClock';
import Button from '@/components/ui/Button';

const PRESETS = [
  { label: '5분', seconds: 300 },
  { label: '10분', seconds: 600 },
  { label: '15분', seconds: 900 },
  { label: '20분', seconds: 1200 },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * BreakTimer — 쉬는시간 화면. 현재 시각을 split-flap 풍 플립시계로 크게 표시(전자칠판용),
 * 아래에 선택적 '재개 알림' 카운트다운. 마스코트로 브랜드 딜라이트.
 */
export default function BreakTimer() {
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { setRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, remaining]);

  function start(seconds) { setTotalSeconds(seconds); setRemaining(seconds); setRunning(true); }
  function stop() { setRunning(false); setRemaining(0); setTotalSeconds(null); }

  const progress = totalSeconds ? remaining / totalSeconds : 0;
  const isFinished = totalSeconds && remaining === 0 && !running;

  return (
    <div className="flex flex-col items-center gap-8 md:gap-10 w-full" onClick={(e) => e.stopPropagation()}>
      {/* 라벨 + 마스코트 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-3"
      >
        <BreakMascot size={64} />
        <div className="text-left">
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isFinished ? '쉬는 시간 끝!' : '쉬는 시간'}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {isFinished ? '이제 수업을 다시 시작할게요' : running ? `${formatTime(remaining)} 후 수업을 이어갑니다` : '잠시 후 수업을 이어갑니다'}
          </p>
        </div>
      </motion.div>

      {/* 현재 시각 — 플립시계 (주인공) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      >
        <FlipClock showSeconds />
      </motion.div>

      {/* 재개 타이머 영역 */}
      {isFinished ? (
        <Button onClick={stop} variant="primary" size="lg">돌아가기</Button>
      ) : running ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }}
            />
          </div>
          <Button onClick={stop} variant="ghost" size="sm">재개 알림 끄기</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">재개 알림</span>
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.seconds}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => start(p.seconds)}
              className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150"
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
