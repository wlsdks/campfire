const variants = {
  primary: 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
  success: 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  warning: 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  error: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  neutral: 'bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
};

export default function Badge({ variant = 'primary', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
