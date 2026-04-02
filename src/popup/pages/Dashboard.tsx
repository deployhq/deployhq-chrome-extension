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

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

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
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const lastDeployed = project.last_deployed_at
    ? formatRelativeTime(project.last_deployed_at)
    : 'Never deployed';

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
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
    </li>
  );
}
