import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useVotes } from '@/hooks/useVotes';

/**
 * Histogram buckets for distribution display.
 * 10 buckets: 0-9, 10-19, ..., 90-100
 */
const BUCKET_COUNT = 10;
const BUCKET_LABELS = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90+'];

function bucketize(voteList) {
  const buckets = new Array(BUCKET_COUNT).fill(0);
  voteList.forEach((v) => {
    const num = parseInt(v.value, 10);
    if (isNaN(num)) return;
    const idx = Math.min(Math.floor(num / 10), BUCKET_COUNT - 1);
    buckets[idx]++;
  });
  return buckets;
}

function computeStats(voteList) {
  const values = voteList
    .map((v) => parseInt(v.value, 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 100);

  if (values.length === 0) {
    return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
  }

  values.sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = Math.round(sum / values.length);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 === 0
    ? Math.round((values[mid - 1] + values[mid]) / 2)
    : values[mid];

  return {
    avg,
    median,
    min: values[0],
    max: values[values.length - 1],
    count: values.length,
  };
}

/** Map 0-100 to color intensity. */
function getBarColor(bucketIndex) {
  const intensity = Math.round((bucketIndex / (BUCKET_COUNT - 1)) * 4);
  const shades = [
    'bg-slate-200 dark:bg-slate-700',
    'bg-slate-300 dark:bg-slate-600',
    'bg-slate-400 dark:bg-slate-500',
    'bg-slate-600 dark:bg-slate-400',
    'bg-slate-800 dark:bg-slate-200',
  ];
  return shades[intensity] || 'bg-slate-400 dark:bg-slate-500';
}

export default memo(function ScaleChart({ sessionId, questionId }) {
  const { voteList, totalVotes } = useVotes(sessionId, questionId);

  const buckets = useMemo(() => bucketize(voteList), [voteList]);
  const stats = useMemo(() => computeStats(voteList), [voteList]);
  const maxBucket = useMemo(() => Math.max(...buckets, 1), [buckets]);

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto px-8">
      {/* Average hero display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="text-center"
      >
        <motion.p
          key={stats.avg}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="text-6xl font-bold text-slate-900 dark:text-slate-100 tabular-nums"
        >
          {stats.count > 0 ? stats.avg : '--'}
        </motion.p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">평균</p>
      </motion.div>

      {/* Average position indicator on 0–100 bar */}
      {stats.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          {/* Track */}
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.avg}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            />
          </div>
          {/* Edge labels */}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-300 dark:text-slate-600">0</span>
            <span className="text-[10px] text-slate-300 dark:text-slate-600">100</span>
          </div>
          {/* Median marker */}
          {stats.count >= 3 && (
            <motion.div
              className="absolute top-0 w-0.5 h-3 bg-white/80 dark:bg-slate-400/80"
              style={{ left: `${stats.median}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              title={`중앙값: ${stats.median}`}
            />
          )}
        </motion.div>
      )}

      {/* Distribution histogram */}
      {stats.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">응답 분포</p>
          <div className="flex items-end gap-1.5 h-24">
            {buckets.map((count, i) => {
              const heightPct = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
              return (
                <motion.div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  {count > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums"
                    >
                      {count}
                    </motion.span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.05 }}
                    className={`w-full rounded-t-md ${count > 0 ? getBarColor(i) : 'bg-slate-100 dark:bg-slate-800'}`}
                    style={{ minHeight: count > 0 ? '4px' : '2px' }}
                  />
                </motion.div>
              );
            })}
          </div>
          {/* Bucket labels */}
          <div className="flex gap-1.5">
            {BUCKET_LABELS.map((label, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-slate-300 dark:text-slate-600">
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats summary */}
      {stats.count >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-6"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">{stats.median}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">중앙값</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">{stats.min}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">최솟값</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">{stats.max}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">최댓값</p>
          </div>
        </motion.div>
      )}

      {/* Total count */}
      <div className="text-center text-slate-400 text-sm pt-2 border-t border-slate-100 dark:border-slate-700">
        총 <span className="text-slate-600 dark:text-slate-300 font-semibold">{totalVotes}</span>명 응답
      </div>
    </div>
  );
});
