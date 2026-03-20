export default function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
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
          className="animate-pulse bg-slate-200 rounded h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
      <div className="animate-pulse bg-slate-200 rounded-lg h-5 w-2/3 mb-3" />
      <div className="space-y-2">
        <div className="animate-pulse bg-slate-200 rounded h-4 w-full" />
        <div className="animate-pulse bg-slate-200 rounded h-4 w-4/5" />
      </div>
    </div>
  );
}

/** Lightweight Suspense fallback — centered spinner for lazy-loaded routes/sections. */
export function SuspenseFallback({ fullPage = true }) {
  return (
    <div className={`${fullPage ? 'min-h-dvh' : 'min-h-[200px]'} bg-slate-50 flex items-center justify-center`}>
      <div className="flex items-center gap-2 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    </div>
  );
}
