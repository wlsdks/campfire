import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function ParticipantList({ participants, voteCounts }) {
  return (
    <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-hide">
      <AnimatePresence>
        {participants.map((p) => {
          const voteCount = voteCounts?.[p.id];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="flex items-center gap-2.5 text-sm text-slate-600 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Avatar name={p.nickname} size="sm" />
              <span className="truncate flex-1">{p.nickname}</span>
              {voteCount > 0 && (
                <span className="text-xs text-slate-400 font-medium tabular-nums shrink-0">{voteCount}답</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {participants.length === 0 && (
        <div className="text-center py-6 space-y-2">
          <Users size={24} className="text-slate-300 mx-auto" />
          <p className="text-slate-400 text-sm">아직 참여자가 없습니다</p>
          <p className="text-slate-300 text-xs">QR코드를 공유하여 학생을 초대하세요</p>
        </div>
      )}
    </div>
  );
}
