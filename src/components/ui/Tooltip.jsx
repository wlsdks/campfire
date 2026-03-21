import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Instant tooltip — shows on hover with no delay.
 * Auto-detects if near top edge and flips to show below.
 */
export default memo(function Tooltip({ label, children }) {
  const [show, setShow] = useState(false);
  const [above, setAbove] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAbove(rect.top > 50);
    }
  }, [show]);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: above ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: above ? 4 : -4 }}
            transition={{ duration: 0.1 }}
            className={`absolute left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium whitespace-nowrap z-[60] pointer-events-none shadow-lg ${
              above ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
