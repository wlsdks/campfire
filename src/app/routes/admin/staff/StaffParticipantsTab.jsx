import { useParticipants } from '@/features/participants/api/useParticipants';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

export default function StaffParticipantsTab({ sessionId }) {
  const { onlineList } = useParticipants(sessionId);

  if (onlineList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <EmptyState title="참여자가 없습니다" description="학생들이 접속하면 여기에 표시됩니다" mascotSize="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        접속 중 {onlineList.length}명
      </p>
      <AnimatePresence>
        {onlineList.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar name={p.nickname} size="sm" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
              {p.nickname}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
