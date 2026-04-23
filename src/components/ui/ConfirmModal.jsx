import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Custom confirm dialog — replaces window.confirm.
 * Design system: centered, backdrop blur, spring animation, dark mode.
 * Portal로 body에 렌더 — 조상의 display:none/hidden에 가려지지 않도록 (Modal.jsx와 일관).
 */
export default function ConfirmModal({
  open, onConfirm, onCancel,
  title, description,
  confirmLabel = '확인', cancelLabel = '취소',
  variant = 'primary',
}) {
  const isDanger = variant === 'danger';

  if (typeof document === 'undefined') return null;

  return createPortal(
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[360px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-6 pt-8 pb-6">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 22 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  <AlertTriangle size={22} className={isDanger ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'} />
                </motion.div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <Button onClick={onCancel} variant="secondary" size="lg" className="flex-1">
                {cancelLabel}
              </Button>
              <Button onClick={onConfirm} variant={isDanger ? 'danger' : 'primary'} size="lg" className="flex-1">
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
