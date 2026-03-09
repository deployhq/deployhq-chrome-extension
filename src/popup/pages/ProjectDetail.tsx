import { useState, useEffect } from 'react';
import type { AppView, Project, Server, ServerGroup, Deployment } from '@/shared/types';
import { api, ApiAuthError } from '@/shared/api';
import { PROTOCOL_LABELS } from '@/shared/constants';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface ProjectDetailProps {
  permalink: string;
  onNavigate: (view: AppView) => void;
}

export default function ProjectDetail({ permalink, onNavigate }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [proj, srvs, grps, deps] = await Promise.all([
        api.getProject(permalink),
        api.listServers(permalink).catch(() => [] as Server[]),
        api.listServerGroups(permalink).catch(() => [] as ServerGroup[]),
        api.listDeployments(permalink).catch(() => ({ pagination: { total: 0, count: 0, per_page: 0, page: 1 }, records: [] as Deployment[] })),
      ]);
      setProject(proj);
      setServers(srvs);
      setGroups(grps);
      setDeployments(deps.records);
    } catch (err) {
      if (err instanceof ApiAuthError) {
        onNavigate({ type: 'login' });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [permalink]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner message="Loading project..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!project) return null;

  return (
    <div className="pb-4">
      {/* Project header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900">{project.name}</h2>
        {project.repository && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{project.repository.url}</p>
        )}
      </div>

      {/* Deploy button */}
      <div className="px-4 py-3">
        <button
          onClick={() => onNavigate({ type: 'deploy', permalink })}
          className="w-full bg-deployhq-600 hover:bg-deployhq-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Deploy
        </button>
      </div>

      {/* Servers */}
      <Section title="Servers">
        {servers.length === 0 ? (
          <p className="px-4 text-xs text-gray-400">No servers configured</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {servers.map((server) => (
              <li key={server.identifier} className="px-4 py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{server.name}</p>
                  <p className="text-xs text-gray-500">
                    {PROTOCOL_LABELS[server.protocol_type] ?? server.protocol_type}
                    {server.environment && ` / ${server.environment}`}
                  </p>
                </div>
                {typeof server.last_revision === 'string' && server.last_revision && (
                  <code className="text-xs text-gray-400 font-mono">
                    {server.last_revision.slice(0, 7)}
                  </code>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Server Groups */}
      {groups.length > 0 && (
        <Section title="Server Groups">
          <ul className="divide-y divide-gray-100">
            {groups.map((group) => (
              <li key={group.identifier} className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{group.name}</p>
                <p className="text-xs text-gray-500">
                  {group.branch} / {group.transfer_order}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Recent Deployments */}
      <Section title="Recent Deployments">
        {deployments.length === 0 ? (
          <p className="px-4 text-xs text-gray-400">No deployments yet</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {deployments.slice(0, 5).map((dep) => (
              <li key={dep.identifier} className="px-4 py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={dep.status} />
                    {typeof dep.end_revision === 'string' && dep.end_revision && (
                      <code className="text-xs text-gray-400 font-mono">
                        {dep.end_revision.slice(0, 7)}
                      </code>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {dep.servers?.map((s) => s.name).join(', ')}
                    {dep.branch && <> &middot; {dep.branch}</>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dep.deployer}
                    {dep.timestamps.completed_at && (
                      <> &middot; {formatTime(dep.timestamps.completed_at)}</>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
        {title}
      </h3>
      {children}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
