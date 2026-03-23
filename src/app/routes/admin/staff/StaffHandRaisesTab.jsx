import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { useHandRaises } from '@/features/hand-raise/api/useHandRaises';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

export default function StaffHandRaisesTab({ sessionId }) {
  const { raisedList, count } = useHandRaises(sessionId);

  async function dismissOne(participantId) {
    try {
      await set(ref(db, `sessions/${sessionId}/handRaises/${participantId}/raised`), false);
    } catch (err) {
      logger.error('손들기 해제 실패:', err);
    }
  }

  if (count === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <EmptyState title="손든 학생이 없습니다" description="학생이 손을 들면 여기에 표시됩니다" mascotSize="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {raisedList.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5"
          >
            <Avatar name={p.nickname} size="sm" />
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
              {p.nickname}
            </span>
            <Button variant="secondary" size="sm" onClick={() => dismissOne(p.id)}>
              도움 완료
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
