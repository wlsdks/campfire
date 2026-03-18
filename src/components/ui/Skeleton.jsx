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
