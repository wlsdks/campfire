import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

/**
 * Floating toast notification — fixed bottom-center.
 * Pair with useToast() hook for state management.
 *
 * @param {string|null} message — when non-null, toast is visible
 */
export default function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-[max(1.5rem,env(safe-area-inset-bottom))] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50"
        >
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
