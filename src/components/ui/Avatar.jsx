const sizes = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <div className={`rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>
      {initial}
    </div>
  );
}
