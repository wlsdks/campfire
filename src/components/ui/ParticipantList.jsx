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
            className="flex items-center gap-2 text-sm text-white/70 py-1"
          >
            <div className="w-2 h-2 rounded-full bg-green-400" />
            {p.nickname}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
