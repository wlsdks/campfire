import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-400',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-300',
  ghost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
};

const sizes = {
  sm: 'py-1.5 px-3 text-sm gap-1.5',
  md: 'py-2.5 px-5 text-base gap-2',
  lg: 'py-3 px-6 text-lg gap-2.5',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', children, className = '', disabled, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default Button;
