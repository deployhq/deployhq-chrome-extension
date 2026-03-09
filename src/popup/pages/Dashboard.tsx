import { useState, useEffect } from 'react';
import type { AppView, Project } from '@/shared/types';
import { api, ApiAuthError } from '@/shared/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      if (err instanceof ApiAuthError) {
        onNavigate({ type: 'login' });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner message="Loading projects..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProjects} />;

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="flex flex-col">
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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
