export default function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 ${className}`}>
      <div className="animate-shimmer rounded-lg h-5 w-2/3 mb-3" />
      <div className="space-y-2">
        <div className="animate-shimmer rounded h-4 w-full" />
        <div className="animate-shimmer rounded h-4 w-4/5" />
      </div>
    </div>
  );
}

/** Layout-matching skeleton for student vote page. */
export function VotePageSkeleton() {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-slate-800 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="animate-shimmer w-8 h-8 rounded-full" />
          <div className="animate-shimmer h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="animate-shimmer w-8 h-8 rounded-full" />
          <div className="animate-shimmer w-8 h-8 rounded-full" />
        </div>
      </div>
      {/* Question + options skeleton */}
      <div className="flex-1 px-5 py-6 space-y-5 max-w-xl mx-auto w-full">
        {/* Question title */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-3">
          <div className="animate-shimmer h-3 w-20 rounded" />
          <div className="animate-shimmer h-5 w-full rounded" />
          <div className="animate-shimmer h-5 w-3/4 rounded" />
          <div className="animate-shimmer h-1.5 w-full rounded-full mt-2" />
        </div>
        {/* Options */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl py-4 px-5 flex items-center gap-3.5">
              <div className="animate-shimmer w-9 h-9 rounded-lg shrink-0" />
              <div className="animate-shimmer h-4 rounded flex-1" style={{ width: `${60 + i * 8}%` }} />
            </div>
          ))}
        </div>
      </div>
      {/* Bottom bar skeleton */}
      <div className="bg-white dark:bg-slate-800 px-5 py-4">
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-shimmer w-14 h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Lightweight Suspense fallback — centered spinner for lazy-loaded routes/sections. */
export function SuspenseFallback({ fullPage = true }) {
  return (
    <div className={`${fullPage ? 'min-h-dvh' : 'min-h-[200px]'} bg-slate-50 dark:bg-slate-900 flex items-center justify-center`}>
      <div className="flex items-center gap-2 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    </div>
  );
}
