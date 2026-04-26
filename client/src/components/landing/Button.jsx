export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-300 text-sm cursor-pointer';
  const variants = {
    primary: 'px-7 py-3.5 bg-saffron-500 hover:bg-saffron-600 text-charcoal shadow-lg shadow-saffron-500/20 hover:shadow-saffron-500/40 hover:-translate-y-0.5',
    secondary: 'px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 backdrop-blur-sm',
    ghost: 'px-4 py-2 text-surface-300 hover:text-white',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
