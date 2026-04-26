const statusConfig = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  picked_up: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  in_transit: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  // Rider statuses
  available: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  busy: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  offline: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  // Invoice statuses
  unpaid: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  // Priority
  urgent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  normal: { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
};

const formatLabel = (status) =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {formatLabel(status)}
    </span>
  );
}
