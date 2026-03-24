import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ open, onClose, children, className = '', ariaLabel }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  // ESC key handler
  useEffect(() => {
    if (!open) return;
    const onEscKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onEscKey);
    return () => document.removeEventListener('keydown', onEscKey);
  }, [open, onClose]);

  // Save previous focus and restore on close
  useEffect(() => {
    if (!open) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      return;
    }
    previousFocusRef.current = document.activeElement;
    const rafId = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // Focus trap: keep Tab cycling within the dialog
  const trapFocus = useCallback(
    (e) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === dialogRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            onKeyDown={trapFocus}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-lg p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] w-full sm:max-w-md outline-none ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
