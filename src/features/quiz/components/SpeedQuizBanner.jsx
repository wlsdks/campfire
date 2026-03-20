import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Square } from 'lucide-react';

/**
 * SpeedQuizBanner — shown on student screen during speed quiz mode.
 * Minimal pill indicating speed quiz is active + question counter.
 */
export default memo(function SpeedQuizBanner({ currentIndex, totalQuestions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <Zap size={16} className="text-white" />
        </motion.div>
        <span className="text-sm font-bold">스피드 퀴즈</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60">
          <span className="font-bold text-white tabular-nums">{currentIndex}</span>
          <span className="text-white/40">/{totalQuestions}</span>
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < currentIndex ? 'bg-white' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});
