import { motion } from 'framer-motion';

const stagger = {
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  },
};

export default function SummaryCard({ label, value, subtitle, progress }) {
  return (
    <motion.div variants={stagger.item} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-sm:p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-3">{label}</p>
      <p className="text-3xl max-sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }} />
        </div>
      )}
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>}
    </motion.div>
  );
}
