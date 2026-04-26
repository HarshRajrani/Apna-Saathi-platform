export default function Card({ children, className = '', glow = false }) {
  return (
    <div className={`relative bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-3xl p-8 transition-all duration-500 hover:border-white/10 hover:bg-white/[0.05] group ${glow ? 'hover:shadow-xl hover:shadow-saffron-500/5' : ''} ${className}`}>
      {children}
    </div>
  );
}
