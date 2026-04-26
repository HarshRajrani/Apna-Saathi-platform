export default function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-12 h-12 rounded-2xl bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-saffron-500/20 transition-colors">
        <Icon className="w-5 h-5 text-saffron-400" />
      </div>
      <div>
        <h4 className="text-white font-semibold text-base mb-1">{title}</h4>
        <p className="text-surface-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
