export default function StatsCard({ title, value, icon: Icon, trend, color = 'primary', subtitle }) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-700 shadow-primary-200',
    green: 'from-emerald-500 to-emerald-700 shadow-emerald-200',
    amber: 'from-amber-500 to-amber-700 shadow-amber-200',
    red: 'from-red-500 to-red-700 shadow-red-200',
    blue: 'from-blue-500 to-blue-700 shadow-blue-200',
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-200',
  };

  return (
    <div className="stat-card group animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1.5">{value}</p>
          {subtitle && (
            <p className="text-xs text-surface-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${
                  trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-surface-400">vs yesterday</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
