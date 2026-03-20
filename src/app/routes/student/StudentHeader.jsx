import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, Volume2, VolumeOff } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';
import Avatar from '@/components/ui/Avatar';
import ConnectionBanner from '@/components/ui/ConnectionBanner';
import { useScores } from '@/features/quiz/api/useScores';
import { getParticipantId, getNickname } from '@/lib/participant';

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
    const controls = animate(motionVal, value, {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    });
    prevRef.current = value;
    return () => { controls.stop(); unsubscribe(); };
  }, [value, motionVal, rounded]);

  return <span ref={displayRef}>{value}점</span>;
}

export default function StudentHeader({ sessionId }) {
  const { scores } = useScores(sessionId);
  const nickname = getNickname();
  const myScore = scores[getParticipantId()];
  const totalScore = myScore?.total || 0;

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
        className="fixed top-0 left-0 right-0 z-20 bg-white/92 dark:bg-slate-800/92 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
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
                className="text-sm font-medium text-slate-500 flex items-center gap-1"
              >
                <Trophy size={14} className="text-slate-500" />
                <HeaderScore value={totalScore} />
              </motion.span>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              aria-label={muted ? '알림음 켜기' : '알림음 끄기'}
              aria-pressed={!muted}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {muted
                ? <VolumeOff size={16} />
                : <Volume2 size={16} />
              }
            </motion.button>
            <Avatar name={nickname} size="sm" />
          </div>
        </div>
      </motion.header>

      <ConnectionBanner />
    </>
  );
}
