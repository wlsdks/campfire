import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentToasts({ submitted, submitError }) {
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
