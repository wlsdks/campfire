export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
