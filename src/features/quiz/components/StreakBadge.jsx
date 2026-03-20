import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

/**
 * StreakBadge — compact flame counter shown during quiz questions.
 * Appears when the student has a streak of 3+ consecutive correct answers.
 * Shows fire icon with shake animation + "N연속!" text.
 *
 * @param {number} streak - current consecutive correct answers
 * @param {boolean} compact - smaller variant for inline use
 */
export default memo(function StreakBadge({ streak = 0, compact = false }) {
  const isHot = streak >= 5;

  return (
    <AnimatePresence>
      {streak >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex items-center justify-center"
        >
          <motion.div
            key={streak}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${
              compact ? 'px-2.5 py-1' : 'px-3.5 py-1.5'
            } ${
              isHot
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <motion.div
              animate={{
                rotate: [-4, 4, -4],
                scale: [1, 1.15, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: isHot ? 0.5 : 0.8,
                ease: 'easeInOut',
              }}
            >
              <Flame
                size={compact ? 13 : 15}
                className={isHot ? 'text-white' : 'text-slate-500'}
              />
            </motion.div>

            <span className={`font-bold tabular-nums ${compact ? 'text-xs' : 'text-sm'}`}>
              {streak}연속!
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
