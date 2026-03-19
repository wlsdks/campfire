const variants = {
  primary: 'bg-slate-50 text-slate-700 border border-slate-200',
  success: 'bg-slate-50 text-slate-600 border border-slate-200',
  warning: 'bg-slate-50 text-slate-600 border border-slate-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  neutral: 'bg-white text-slate-500 border border-slate-200',
};

export default function Badge({ variant = 'primary', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
