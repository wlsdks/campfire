import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, Ticket, Volume2, VolumeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import PickMascot from '@/components/ui/PickMascot';
import Avatar from '@/components/ui/Avatar';
import ConnectionBanner from '@/components/ui/ConnectionBanner';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useMyScore } from '@/features/quiz/api/useScores';
import { useSession } from '@/features/session/api/useSession';
import ElapsedTime from '@/components/ui/ElapsedTime';
import { getNickname, clearSessionJoined } from '@/lib/participant';

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
  const { session } = useSession(sessionId);
  const { myScore } = useMyScore(sessionId);
  const { connected } = useConnectionStatus();
  const nickname = getNickname();
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

  const handleChangeNickname = useCallback(() => {
    clearSessionJoined(sessionId);
    window.dispatchEvent(new CustomEvent('pick:change-nickname'));
  }, [sessionId]);

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
            <div className="relative">
              <PickMascot size="xs" />
              {/* 연결 상태 dot — emerald 연결 / amber 끊김 (debounced).
                  CLAUDE.md 페르소나 "Wi-Fi 불안정 시 연결 상태 표시 중요" 충족. */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 transition-colors duration-300 ${
                  connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
                aria-label={connected ? '서버 연결됨' : '서버 재연결 중'}
                title={connected ? '실시간 연결됨' : '재연결 중...'}
              />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">Pick</span>
            <ElapsedTime startedAt={session?.startedAt} status={session?.status} />
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
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleChangeNickname}
              aria-label="닉네임 변경"
              className="relative group"
            >
              <Avatar name={nickname} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-300">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <ConnectionBanner />
    </>
  );
}
