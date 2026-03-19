const variants = {
  primary: 'bg-slate-100 text-slate-700',
  success: 'bg-slate-100 text-slate-600',
  warning: 'bg-slate-100 text-slate-600',
  error: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export default function Badge({ variant = 'primary', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
