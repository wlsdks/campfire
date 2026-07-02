import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { hapticSuccess } from '@/lib/haptics';

/**
 * RandomPicker — 랜덤 발표자 선정 (콜드콜).
 * 이름이 빠르게 순환 → 감속 → 멈춤 → 발표자 reveal.
 * 연속 중복 방지. 확정 시 onResult([{id,nickname}]) — 뽑힌 학생 폰에 알림(gameResult publish).
 */
export default function RandomPicker({ participants, onResult }) {
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [history, setHistory] = useState([]);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const names = useMemo(() => participants.map(p => p.nickname), [participants]);

  const pick = useCallback(() => {
    if (picking || names.length === 0) return;
    setPicking(true);
    setSelected(null);

    // Exclude recently picked (up to last 3) to prevent repetition
    const excluded = new Set(history.slice(-Math.min(3, Math.floor(names.length / 2))));
    // 참가자 객체로 뽑아 id를 보존 — 닉네임 문자열만 넘기면 동명이인 오귀속 가능
    const candidates = participants.filter(p => !excluded.has(p.nickname));
    const pool = candidates.length > 0 ? candidates : participants;
    const winnerP = pool[Math.floor(Math.random() * pool.length)];
    const winner = winnerP.nickname;

    // Fast cycling phase (80ms intervals)
    let count = 0;
    const totalCycles = 25 + Math.floor(Math.random() * 10);
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      count++;
      setDisplayName(names[Math.floor(Math.random() * names.length)]);

      // Slow down in last 8 cycles
      if (count >= totalCycles - 8) {
        clearInterval(intervalRef.current);
        // Decelerating phase
        let remaining = totalCycles - count;
        function decelStep() {
          if (!mountedRef.current || remaining <= 0) {
            // Final: show winner
            setDisplayName(winner);
            timeoutRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              setPicking(false);
              setSelected(winner);
              setHistory(prev => [...prev, winner]);
              hapticSuccess();
              onResult?.([{ id: winnerP.id, nickname: winnerP.nickname }]);
            }, 300);
            return;
          }
          remaining--;
          const delay = 120 + (totalCycles - count - remaining) * 40;
          setDisplayName(names[Math.floor(Math.random() * names.length)]);
          timeoutRef.current = setTimeout(decelStep, delay);
        }
        decelStep();
      }
    }, 80);
  }, [picking, names, history, participants, onResult]);

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <UserCircle size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">발표자 뽑기</h3>
        <p className="text-slate-400 text-base">참여자가 접속하면 시작할 수 있어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">발표자 뽑기</h3>

      {/* Name display area */}
      <div className="w-full flex flex-col items-center gap-6">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="selected-avatar"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <Avatar name={selected} size="2xl" />
            </motion.div>
          ) : picking && displayName ? (
            <motion.div
              key="cycling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
            >
              <motion.span
                key={displayName}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.6 }}
                className="text-4xl font-bold text-slate-900 dark:text-slate-100"
              >
                {displayName.charAt(0).toUpperCase()}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <UserCircle size={48} className="text-slate-300 dark:text-slate-600" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name text */}
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{selected}</p>
              </motion.div>
            ) : picking && displayName ? (
              <motion.p
                key={displayName}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.6 }}
                className="text-3xl font-bold text-slate-400 dark:text-slate-500 tracking-tight"
              >
                {displayName}
              </motion.p>
            ) : (
              <p className="text-lg text-slate-400">버튼을 눌러 발표자를 뽑으세요</p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected badge */}
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
            className="inline-flex items-center px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-base font-bold"
          >
            발표 차례!
          </motion.span>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        {selected && (
          <Button onClick={() => { setSelected(null); setDisplayName(null); }} variant="secondary" size="lg">
            <RefreshCw size={18} /> 다시 뽑기
          </Button>
        )}
        <Button onClick={pick} disabled={picking} variant="primary" size="lg">
          {picking ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              뽑는 중...
            </span>
          ) : selected ? '한 번 더' : '발표자 뽑기'}
        </Button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {history.map((name, i) => (
            <span key={`${name}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400">
              {i + 1}. {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
