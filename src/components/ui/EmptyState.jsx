import { motion } from 'framer-motion';
import PinggoMascot from './PinggoMascot';

/**
 * Friendly empty-state component for admin screens.
 * Shows the Pinggo mascot, a title, description, and optional action steps.
 *
 * @param {string} title — main message
 * @param {string} description — sub-description
 * @param {string[]} steps — optional step-by-step guidance
 * @param {'xs' | 'sm' | 'md' | 'lg'} mascotSize
 * @param {'happy' | 'waiting' | 'thinking'} mood
 * @param {React.ReactNode} children — optional extra content below
 * @param {string} className — additional wrapper classes
 */
export default function EmptyState({
  title,
  description,
  steps,
  mascotSize = 'md',
  mood = 'waiting',
  children,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col items-center text-center ${className}`}
    >
      <PinggoMascot size={mascotSize} mood={mood} />

      <div className="mt-6 space-y-1.5">
        <p className="text-slate-600 text-lg font-semibold">{title}</p>
        {description && (
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        )}
      </div>

      {steps && steps.length > 0 && (
        <div className="mt-5 space-y-2 w-full max-w-xs">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.15 + i * 0.06 }}
              className="flex items-start gap-2.5 text-left"
            >
              <span className="text-xs font-bold text-slate-300 mt-0.5 w-4 shrink-0 text-center">
                {i + 1}
              </span>
              <span className="text-sm text-slate-400 leading-relaxed">{step}</span>
            </motion.div>
          ))}
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  );
}
