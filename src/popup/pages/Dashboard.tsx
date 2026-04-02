import { useState, useEffect } from 'react';
import type { AppView, Project, ActivityEvent, DeployStats } from '@/shared/types';
import { api, ApiAuthError } from '@/shared/api';
import { formatRelativeTime } from '@/shared/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatsWidget from '../components/StatsWidget';
import ActivityItem from '../components/ActivityItem';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

type Tab = 'activity' | 'projects';

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('activity');
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<DeployStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsResult, activityResult] = await Promise.allSettled([
        api.listProjects(),
        api.listActivityWithStats(),
      ]);

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      } else {
        const err = projectsResult.reason;
        if (err instanceof ApiAuthError) {
          onNavigate({ type: 'login' });
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      }

      if (activityResult.status === 'fulfilled') {
        setEvents(activityResult.value.events);
        setStats(activityResult.value.stats);
      }
      // Stats/activity errors are silently ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner message="Loading..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const handleStar = async (permalink: string) => {
    try {
      const result = await api.starProject(permalink);
      setProjects((prev) =>
        prev.map((p) => (p.permalink === permalink ? { ...p, starred: result.starred } : p))
      );
    } catch {
      // Silently ignore star errors
    }
  };

  const sorted = [...projects].sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    return 0;
  });

  const filtered = search
    ? sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const tabClasses = (t: Tab) =>
    `px-4 py-2 text-sm ${
      tab === t
        ? 'text-deployhq-600 border-b-2 border-deployhq-600 font-medium'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200" role="tablist">
        <button className={tabClasses('activity')} onClick={() => setTab('activity')} role="tab" aria-selected={tab === 'activity'}>
          Activity
        </button>
        <button className={tabClasses('projects')} onClick={() => setTab('projects')} role="tab" aria-selected={tab === 'projects'}>
          Projects
        </button>
      </div>

      {/* Tab content */}
      {tab === 'activity' && (
        <div className="pb-4" role="tabpanel">
          {stats && (
            <div className="px-4 py-3">
              <StatsWidget stats={stats} />
            </div>
          )}
          <div className="mt-1">
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
              Recent Activity
            </h3>
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No recent activity
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((event, index) => (
                  <ActivityItem
                    key={`${event.created_at}-${index}`}
                    event={event}
                    onProjectClick={(permalink) =>
                      onNavigate({ type: 'project', permalink })
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div role="tabpanel">
          <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 focus:border-deployhq-500 bg-gray-50"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {search ? 'No projects match your search.' : 'No projects found.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((project) => (
                <ProjectRow
                  key={project.identifier}
                  project={project}
                  onClick={() => onNavigate({ type: 'project', permalink: project.permalink })}
                  onStar={() => handleStar(project.permalink)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project, onClick, onStar }: { project: Project; onClick: () => void; onStar: () => void }) {
  const lastDeployed = project.last_deployed_at
    ? formatRelativeTime(project.last_deployed_at)
    : 'Never deployed';

  return (
    <li>
      <div className="flex items-center hover:bg-gray-50 transition-colors">
        <button
          onClick={onClick}
          className="flex-1 px-4 py-3 flex items-center gap-3 text-left min-w-0"
        >
          <div className="w-8 h-8 bg-deployhq-100 text-deployhq-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {project.repository?.url ?? 'No repository'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">{lastDeployed}</p>
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          className="pr-4 pl-1 py-3 shrink-0"
          aria-label={project.starred ? 'Unstar project' : 'Star project'}
        >
          <svg
            className={`w-4 h-4 ${project.starred ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'} transition-colors`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            fill={project.starred ? 'currentColor' : 'none'}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
    </li>
  );
}
