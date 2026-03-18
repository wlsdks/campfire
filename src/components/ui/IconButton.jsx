import { motion } from 'framer-motion';

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const variants = {
  ghost: 'hover:bg-slate-100 text-slate-500 hover:text-slate-700',
  subtle: 'bg-slate-50 hover:bg-slate-100 text-slate-600',
  primary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600',
  danger: 'hover:bg-red-50 text-slate-400 hover:text-red-500',
};

export default function IconButton({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  label,
  className = '',
  ...props
}) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none ${sizes[size]} ${variants[variant]} ${className}`}
      aria-label={label}
      {...props}
    >
      <Icon size={iconSize} />
    </motion.button>
  );
}
