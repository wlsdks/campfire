import { memo } from 'react';
import { motion } from 'framer-motion';


export default memo(function LiveParticipation({ voted, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">참여</span>
        <span className="text-sm text-slate-400 tabular-nums">
          <span className="text-slate-100 font-bold">{voted}</span>
          <span className="mx-0.5">/</span>
          {total}명
          <span className="ml-1.5 text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
});
