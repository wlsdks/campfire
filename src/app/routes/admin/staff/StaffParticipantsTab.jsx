import { useState } from 'react';
import { useParticipants } from '@/features/participants/api/useParticipants';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

const INITIAL_SHOW = 30;

export default function StaffParticipantsTab({ sessionId }) {
  const { onlineList } = useParticipants(sessionId);
  const [expanded, setExpanded] = useState(false);

  if (onlineList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <EmptyState title="참여자가 없습니다" description="학생들이 접속하면 여기에 표시됩니다" mascotSize="sm" />
      </div>
    );
  }

  const visible = expanded ? onlineList : onlineList.slice(0, INITIAL_SHOW);
  const remaining = onlineList.length - INITIAL_SHOW;

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        접속 중 {onlineList.length}명
      </p>
      <AnimatePresence initial={false}>
        {visible.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
          >
            <Avatar name={p.nickname} size="sm" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
              {p.nickname}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center justify-center gap-1 transition-colors duration-150"
        >
          <ChevronDown size={14} />
          {remaining}명 더 보기
        </button>
      )}
    </div>
  );
}
