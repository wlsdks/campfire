import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

/**
 * Custom confirm dialog — replaces window.confirm with styled modal.
 * Matches design system: slate monochrome, spring animation, dark mode.
 */
export default function ConfirmModal({ open, onConfirm, onCancel, title, description, confirmLabel = '확인', cancelLabel = '취소', variant = 'primary' }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            key="confirm-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 p-6"
          >
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={onCancel} variant="secondary" size="lg" className="flex-1">
                {cancelLabel}
              </Button>
              <Button onClick={onConfirm} variant={variant} size="lg" className="flex-1">
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
