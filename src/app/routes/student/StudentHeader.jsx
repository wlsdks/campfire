import { motion } from 'framer-motion';
import { Radio, Trophy } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useScores } from '@/features/quiz/api/useScores';
import { getParticipantId, getNickname } from '@/lib/participant';

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
      className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-indigo-600" />
          <span className="font-bold text-lg text-slate-900">Pinggo</span>
        </div>

        <div className="flex items-center gap-3">
          {totalScore > 0 && (
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
              <Trophy size={14} className="text-amber-500" />
              {totalScore}점
            </span>
          )}
          <Avatar name={nickname} size="sm" />
        </div>
      </div>
    </motion.header>
  );
}
