import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';
import Badge from '@/components/ui/Badge';

export default memo(function LiveHeader({ courseName, roundNumber, count }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center gap-2.5">
        <PickMascot size="xs" />
        <span className="text-slate-100 font-bold text-lg tracking-tight">Pick</span>
      </div>

      <div className="flex items-center gap-2">
        {courseName && (
          <span className="text-slate-300 text-sm font-medium truncate max-w-[240px]">
            {courseName}
          </span>
        )}
        {roundNumber && (
          <Badge variant="neutral" className="!bg-slate-700 !text-slate-300">
            {roundNumber}회차
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Users size={16} className="text-slate-400" />
        <motion.span
          key={count}
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-slate-100 font-bold text-lg tabular-nums"
        >
          {count}
        </motion.span>
        <span className="text-slate-400 text-xs">명</span>
      </div>
    </header>
  );
});
