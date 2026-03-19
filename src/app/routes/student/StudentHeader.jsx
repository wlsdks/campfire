import { motion } from 'framer-motion';
import { Radio, Trophy } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useScores } from '@/features/quiz/api/useScores';
import { getParticipantId, getNickname } from '@/lib/participant';

/**
 * Persistent top header bar for all student screens.
 * Shows branding, score (if any), and user avatar.
 *
 * @param {{ sessionId: string }} props
 */
export default function StudentHeader({ sessionId }) {
  const { scores } = useScores(sessionId);
  const nickname = getNickname();
  const myScore = scores[getParticipantId()];
  const totalScore = myScore?.total || 0;

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-100"
    >
      <div className="flex items-center justify-between max-w-sm mx-auto px-4 py-2.5">
        {/* Left: branding */}
        <div className="flex items-center gap-1.5">
          <Radio size={16} className="text-indigo-500" />
          <span className="font-semibold text-sm text-slate-700">Pinggo</span>
        </div>

        {/* Right: score + avatar */}
        <div className="flex items-center gap-2.5">
          {totalScore > 0 && (
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Trophy size={12} className="text-amber-500" />
              {totalScore}점
            </span>
          )}
          <Avatar name={nickname} size="sm" />
        </div>
      </div>
    </motion.header>
  );
}
