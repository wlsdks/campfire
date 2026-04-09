import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DrumrollOverlay — 두구두구 긴장감 연출.
 * 화면 전체를 덮으며 흔들림 + 펄스 + 드럼 사운드.
 * duration(ms) 후 자동으로 onComplete 호출.
 */
export default memo(function DrumrollOverlay({ active, onComplete, duration = 2500 }) {
  const [phase, setPhase] = useState(0); // 0=시작, 1=가속, 2=절정
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // 드럼 사운드 생성 (Web Audio API)
  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }

    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = ctx;
    } catch {
      // Audio not supported
    }

    // 페이즈 전환
    const t1 = setTimeout(() => setPhase(1), duration * 0.3);
    const t2 = setTimeout(() => setPhase(2), duration * 0.7);
    timerRef.current = setTimeout(() => {
      onComplete?.();
    }, duration);

    // 드럼 비트 생성
    if (ctx) {
      let beatInterval = 300;
      let beatCount = 0;
      const maxBeats = Math.floor(duration / 100);

      function playBeat() {
        if (beatCount >= maxBeats || !active) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 80 + Math.random() * 40;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);

          // 갈수록 빨라짐
          beatCount++;
          const progress = beatCount / maxBeats;
          beatInterval = Math.max(60, 300 - progress * 250);
          setTimeout(playBeat, beatInterval);
        } catch { /* ignore */ }
      }
      setTimeout(playBeat, 200);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) {
        try { audioRef.current.close(); } catch { /* ignore */ }
      }
    };
  }, [active, duration, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {/* 배경 펄스 링 */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full border-4 border-white/20"
          />
          <motion.div
            animate={{
              scale: [1, 2, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            className="absolute w-64 h-64 rounded-full border-4 border-white/10"
          />

          {/* 메인 텍스트 */}
          <motion.div
            animate={
              phase === 2
                ? { scale: [1, 1.15, 0.95, 1.1, 1], rotate: [0, -2, 2, -1, 0] }
                : phase === 1
                  ? { scale: [1, 1.08, 1], rotate: [0, -1, 1, 0] }
                  : { scale: [1, 1.03, 1] }
            }
            transition={{
              duration: phase === 2 ? 0.3 : phase === 1 ? 0.5 : 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-center"
          >
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: phase === 2 ? 0.2 : 0.6, repeat: Infinity }}
              className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tight"
            >
              {phase === 2 ? '두구두구!!' : phase === 1 ? '두구두구' : '두구...'}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-lg text-white/50 mt-4 font-medium"
            >
              정답 공개 준비 중...
            </motion.p>
          </motion.div>

          {/* 양쪽 북 이모지 대체 (lucide 아이콘 없으므로 CSS 원으로) */}
          <motion.div
            animate={phase >= 1
              ? { x: [-8, 8, -8], rotate: [-10, 10, -10] }
              : { x: [-4, 4, -4] }}
            transition={{ duration: phase === 2 ? 0.15 : 0.3, repeat: Infinity }}
            className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/30 border-2 border-amber-400/50 flex items-center justify-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-400/60" />
            </div>
          </motion.div>
          <motion.div
            animate={phase >= 1
              ? { x: [8, -8, 8], rotate: [10, -10, 10] }
              : { x: [4, -4, 4] }}
            transition={{ duration: phase === 2 ? 0.15 : 0.3, repeat: Infinity }}
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/30 border-2 border-amber-400/50 flex items-center justify-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-400/60" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
