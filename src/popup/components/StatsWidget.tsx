import type { DeployStats } from '@/shared/types';

interface StatsWidgetProps {
  stats: DeployStats;
  onClick?: () => void;
}

function DeltaIndicator({
  delta,
  suffix = '',
  positiveColor = 'text-gray-500',
  negativeColor = 'text-gray-500',
}: {
  delta: number | null;
  suffix?: string;
  positiveColor?: string;
  negativeColor?: string;
}) {
  if (delta === null) return null;
  if (delta === 0) return <span className="text-xs text-gray-400">&mdash;</span>;

  const isPositive = delta > 0;
  const color = isPositive ? positiveColor : negativeColor;
  const arrow = isPositive ? '▲' : '▼';
  const formatted = isPositive ? `+${delta}${suffix}` : `${delta}${suffix}`;

  return (
    <span className={`text-xs ${color}`}>
      {arrow} {formatted}
    </span>
  );
}

export default function StatsWidget({ stats, onClick }: StatsWidgetProps) {
  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      className={`w-full grid grid-cols-2 gap-3 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Deploys */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">Deploys</p>
          <p className="text-sm font-semibold text-gray-900">{stats.total_deployments}</p>
          <DeltaIndicator delta={stats.total_deployments_delta} />
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 shrink-0">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className="text-sm font-semibold text-gray-900">
            {stats.success_rate !== null ? `${stats.success_rate}%` : '\u2014'}
          </p>
          <DeltaIndicator
            delta={stats.success_rate_delta}
            suffix="%"
            positiveColor="text-emerald-600"
            negativeColor="text-red-600"
          />
        </div>
      </div>

      {/* Avg Duration */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Duration</p>
          <p className="text-sm font-semibold text-gray-900">{stats.avg_duration}</p>
        </div>
      </div>

      {/* Active Servers */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 shrink-0">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm9 6h.008v.008H15v-.008zm0-6h.008v.008H15v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">Active Servers</p>
          <p className="text-sm font-semibold text-gray-900">{stats.active_servers}</p>
        </div>
      </div>
    </Container>
  );
}
