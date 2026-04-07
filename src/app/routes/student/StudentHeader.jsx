import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, Ticket, Volume2, VolumeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import PickMascot from '@/components/ui/PickMascot';
import Avatar from '@/components/ui/Avatar';
import ConnectionBanner from '@/components/ui/ConnectionBanner';
import { useScores } from '@/features/quiz/api/useScores';
import { getParticipantId, getNickname } from '@/lib/participant';

function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '라이트 모드' : '다크 모드'}
      className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </motion.button>
  );
}

/** Animated score counter for the header. */
function HeaderScore({ value }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const displayRef = useRef(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = `${v}점`;
    });
    // Guard: if value decreased (network jitter), set instantly without animation
    if (value < prevRef.current) {
      motionVal.set(value);
    } else {
      var controls = animate(motionVal, value, {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      });
    }
    prevRef.current = value;
    return () => { controls?.stop(); unsubscribe(); };
  }, [value, motionVal, rounded]);

  return <span ref={displayRef}>{value}점</span>;
}

export default function StudentHeader({ sessionId }) {
  const { scores } = useScores(sessionId);
  const nickname = getNickname();
  const myScore = scores[getParticipantId()];
  const totalScore = myScore?.total || 0;
  const tickets = myScore?.tickets || 0;

  // Sound mute toggle
  const [muted, setMuted] = useState(
    () => localStorage.getItem('pinggo_sound_muted') === 'true'
  );
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem('pinggo_sound_muted', String(next));
      return next;
    });
  }, []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        aria-label="Pick 학생 헤더"
        className="fixed top-0 left-0 right-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-5 py-4 max-w-[620px] mx-auto">
          <div className="flex items-center gap-2.5">
            <PickMascot size="xs" />
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">Pick</span>
          </div>

          <div className="flex items-center gap-4">
            {totalScore > 0 && (
              <motion.span
                key="score"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1"
              >
                <Trophy size={14} className="text-slate-500 dark:text-slate-400" />
                <HeaderScore value={totalScore} />
              </motion.span>
            )}
            {tickets > 0 && (
              <motion.span
                key="tickets"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1"
              >
                <Ticket size={14} className="text-slate-500 dark:text-slate-400" />
                {tickets}
              </motion.span>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              aria-label={muted ? '알림음 켜기' : '알림음 끄기'}
              aria-pressed={!muted}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              {muted
                ? <VolumeOff size={16} />
                : <Volume2 size={16} />
              }
            </motion.button>
            <ThemeToggle />
            <Avatar name={nickname} size="sm" />
          </div>
        </div>
      </motion.header>

      <ConnectionBanner />
    </>
  );
}
