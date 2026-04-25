import type { ActivityEvent } from '@/shared/types';
import { EVENT_LABELS } from '@/shared/constants';
import { formatRelativeTime } from '@/shared/utils';

interface ActivityItemProps {
  event: ActivityEvent;
  onProjectClick?: (permalink: string) => void;
}

function humanizeEvent(event: string): string {
  return event
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Maps event types to DeployHQ-style badge colors */
function getEventBadgeClasses(event: string): { bg: string; text: string; dot: string } {
  if (event.includes('completed') || event.includes('success')) {
    return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
  }
  if (event.includes('failed') || event.includes('error')) {
    return { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
  }
  if (event.includes('running') || event.includes('started')) {
    return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
  }
  if (event.includes('pending') || event.includes('queued')) {
    return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
  }
  if (event.includes('cancelled') || event.includes('aborted')) {
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-500' };
  }
  if (event.includes('preview')) {
    return { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' };
  }
  return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-500' };
}

export default function ActivityItem({ event, onProjectClick }: ActivityItemProps) {
  const label = EVENT_LABELS[event.event] ?? humanizeEvent(event.event);
  const badge = getEventBadgeClasses(event.event);
  const servers = Array.isArray(event.properties.servers)
    ? (event.properties.servers as unknown[]).filter((s): s is string => typeof s === 'string').join(', ')
    : '';

  return (
    <li className="px-4 py-2.5 flex items-start gap-3">
      {/* Left: colored badge */}
      <div className="shrink-0 mt-0.5">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {label}
        </span>
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
          {onProjectClick ? (
            <button
              onClick={() => onProjectClick(event.project.permalink)}
              className="text-deployhq-600 dark:text-deployhq-300 hover:text-deployhq-700 dark:hover:text-deployhq-200 hover:underline font-medium"
            >
              {event.project.name}
            </button>
          ) : (
            <span className="font-medium">{event.project.name}</span>
          )}
          {servers && <span className="text-gray-400 dark:text-gray-500"> &middot; {servers}</span>}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {event.user} &middot; {formatRelativeTime(event.created_at)}
        </p>
      </div>
    </li>
  );
}
