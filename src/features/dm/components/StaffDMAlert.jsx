import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ArrowRight } from 'lucide-react';
import { useStaffDMs } from '@/features/dm/api/useStaffDMs';
import StaffDMChat from '@/features/dm/components/StaffDMChat';

const DMAlertItem = memo(function DMAlertItem({ dm, onRespond, onDismiss }) {
  const firstMsg = dm.messageList?.[0]?.text || '';
  const preview = firstMsg.length > 40 ? firstMsg.slice(0, 40) + '...' : firstMsg;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-3.5 flex items-start gap-3"
    >
      <div className="shrink-0 mt-0.5">
        <MessageSquare size={16} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {dm.studentName || '학생'}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            도움 요청
          </span>
        </div>
        {preview && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{preview}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onRespond(dm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150"
          >
            응답
            <ArrowRight size={12} />
          </button>
          <button
            onClick={() => onDismiss(dm.id)}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors duration-150"
          >
            확인
          </button>
        </div>
      </div>
      <button
        onClick={() => onDismiss(dm.id)}
        className="p-1 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150 shrink-0"
        aria-label="닫기"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
});

export default function StaffDMAlert({ sessionId, staffId, staffName, senderType }) {
  const { waitingDMs, activeDMs, respondToDM, resolveDM, sendMessage } = useStaffDMs(sessionId);
  const [dismissed, setDismissed] = useState(new Set());
  const [openDM, setOpenDM] = useState(null);

  const visibleWaiting = waitingDMs.filter((dm) => !dismissed.has(dm.id));

  // Keep openDM in sync with live activeDMs data
  const liveDM = openDM ? activeDMs.find((d) => d.id === openDM.id) || openDM : null;

  function handleDismiss(id) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  async function handleRespond(dm) {
    await respondToDM(dm.id, staffId, staffName);
    setDismissed((prev) => new Set([...prev, dm.id]));
    setOpenDM({ ...dm, status: 'active', staffName });
  }

  return (
    <>
      {/* Waiting DM alerts */}
      <AnimatePresence>
        {visibleWaiting.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-3 right-3 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-1.5rem)]"
          >
            <AnimatePresence mode="popLayout">
              {visibleWaiting.map((dm) => (
                <DMAlertItem
                  key={dm.id}
                  dm={dm}
                  onRespond={handleRespond}
                  onDismiss={handleDismiss}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active DM indicator removed — DM is accessible via staff right panel */}

      {/* DM Chat modal */}
      <StaffDMChat
        dm={liveDM}
        open={!!liveDM}
        onClose={() => setOpenDM(null)}
        onResolve={resolveDM}
        onSendMessage={sendMessage}
        staffName={staffName}
        senderType={senderType || 'staff'}
        allActiveDMs={activeDMs}
        onSwitchDM={setOpenDM}
      />
    </>
  );
}
