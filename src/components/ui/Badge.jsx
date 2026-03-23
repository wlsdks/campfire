const variants = {
  primary: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  neutral: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
};

export default function Badge({ variant = 'primary', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
