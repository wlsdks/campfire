import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import PinggoMascot from '@/components/ui/PinggoMascot';

export default memo(function ParticipantList({ participants, voteCounts }) {
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
                <span className="text-xs text-slate-400 font-medium tabular-nums shrink-0">{voteCount}개 참여</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {participants.length === 0 && (
        <div className="flex flex-col items-center text-center py-5 space-y-2">
          <PinggoMascot size="xs" mood="waiting" />
          <p className="text-slate-400 text-sm font-medium">아직 참여자가 없습니다</p>
          <p className="text-slate-300 text-xs leading-relaxed">아래 QR코드를 공유하여<br />학생을 초대하세요</p>
        </div>
      )}
    </div>
  );
});
