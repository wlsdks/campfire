const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <div className={`rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>
      {initial}
    </div>
  );
}
