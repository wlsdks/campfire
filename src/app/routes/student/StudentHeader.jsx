import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Radio, Trophy } from 'lucide-react';
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

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        aria-label="Pinggo 학생 헤더"
        className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200"
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-indigo-600" />
            <span className="font-bold text-lg text-slate-900">Pinggo</span>
          </div>

          <div className="flex items-center gap-3">
            {totalScore > 0 && (
              <motion.span
                key="score"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="text-sm font-medium text-slate-500 flex items-center gap-1"
              >
                <Trophy size={14} className="text-slate-500" />
                <HeaderScore value={totalScore} />
              </motion.span>
            )}
            <Avatar name={nickname} size="sm" />
          </div>
        </div>
      </motion.header>

      <ConnectionBanner />
    </>
  );
}
