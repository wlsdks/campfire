import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

export default function ParticipantList({ participants }) {
  return (
    <div className="space-y-0.5 max-h-64 overflow-y-auto">
      <AnimatePresence>
        {participants.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex items-center gap-2.5 text-sm text-slate-600 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Avatar name={p.nickname} size="sm" />
            <span className="truncate">{p.nickname}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {participants.length === 0 && (
        <p className="text-slate-300 text-xs text-center py-4">아직 참여자가 없습니다</p>
      )}
    </div>
  );
}
