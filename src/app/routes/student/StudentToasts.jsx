import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Headset, Hand } from 'lucide-react';

export default function StudentToasts({ submitted, submitError, dmResolved, handAcknowledged }) {
  return (
    <>
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={16} />
            질문이 전송되었습니다
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            role="alert"
            className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-red-500 dark:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dmResolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <Headset size={16} />
            {dmResolved}님이 도움을 완료했습니다
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {handAcknowledged && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <Hand size={16} />
            선생님이 확인했어요
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
