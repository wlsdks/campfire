import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BottomSheet — mobile-native bottom sheet with drag-to-dismiss.
 * 25-30% higher engagement than centered modals (NN/g research).
 *
 * @param {boolean} open — whether the sheet is visible
 * @param {function} onClose — called when sheet is dismissed
 * @param {string} [ariaLabel] — accessibility label
 * @param {ReactNode} children — sheet content
 */
export default memo(function BottomSheet({ open, onClose, ariaLabel, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            role="dialog"
            aria-label={ariaLabel}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl z-50 max-h-[85dvh] flex flex-col overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
