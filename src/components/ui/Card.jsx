export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 ${hover ? 'hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow] duration-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
