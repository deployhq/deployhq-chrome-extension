import type { DeploymentStatus } from '@/shared/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/shared/constants';

interface StatusBadgeProps {
  status: DeploymentStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      }`}
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className={`rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${
          status === 'running' || status === 'pending' ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
