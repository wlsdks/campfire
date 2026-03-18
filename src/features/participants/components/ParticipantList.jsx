import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipantList({ participants }) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      <AnimatePresence>
        {participants.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2.5 text-sm text-gray-600 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{p.nickname}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {participants.length === 0 && (
        <p className="text-gray-300 text-xs text-center py-4">아직 참여자가 없습니다</p>
      )}
    </div>
  );
}
