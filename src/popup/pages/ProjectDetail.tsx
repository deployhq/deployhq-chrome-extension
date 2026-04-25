import { useState, useEffect } from 'react';
import type { AppView, Project, Server, ServerGroup, Deployment } from '@/shared/types';
import { api, ApiAuthError } from '@/shared/api';
import { PROTOCOL_LABELS } from '@/shared/constants';
import { formatRelativeTime } from '@/shared/utils';
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

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

  const handleAbort = async (identifier: string) => {
    setActionLoading(identifier);
    setActionError('');
    try {
      await api.abortDeployment(permalink, identifier);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to abort deployment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (identifier: string) => {
    setActionLoading(identifier);
    setActionError('');
    try {
      await api.retryDeployment(permalink, identifier);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to retry deployment');
    } finally {
      setActionLoading(null);
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
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{project.name}</h2>
        {project.repository && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{project.repository.url}</p>
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

      {/* Servers (ungrouped only) */}
      {(() => {
        const ungrouped = servers.filter((s) => !s.server_group_identifier);
        return ungrouped.length > 0 ? (
          <Section title="Servers">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {ungrouped.map((server) => (
                <ServerRow key={server.identifier} server={server} />
              ))}
            </ul>
          </Section>
        ) : servers.length === 0 ? (
          <Section title="Servers">
            <p className="px-4 text-xs text-gray-400 dark:text-gray-500">No servers configured</p>
          </Section>
        ) : null;
      })()}

      {/* Server Groups with nested servers */}
      {groups.length > 0 && (
        <Section title="Server Groups">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map((group) => {
              const groupServers = servers.filter(
                (s) => s.server_group_identifier === group.identifier
              );
              return (
                <li key={group.identifier} className="py-2">
                  <div className="px-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{group.name}</p>
                    {(group.branch || group.transfer_order) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {[group.branch, group.transfer_order].filter(Boolean).join(' / ')}
                      </p>
                    )}
                  </div>
                  {groupServers.length > 0 && (
                    <ul className="mt-1 ml-4 divide-y divide-gray-50 dark:divide-gray-800">
                      {groupServers.map((server) => (
                        <ServerRow key={server.identifier} server={server} />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* Recent Deployments */}
      <Section title="Recent Deployments">
        {deployments.length === 0 ? (
          <p className="px-4 text-xs text-gray-400 dark:text-gray-500">No deployments yet</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {deployments.slice(0, 5).map((dep) => (
              <li key={dep.identifier} className="px-4 py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={dep.status} />
                    {typeof dep.end_revision === 'string' && dep.end_revision && (
                      <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {dep.end_revision.slice(0, 7)}
                      </code>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {dep.servers?.map((s) => s.name).join(', ')}
                    {dep.branch && <> &middot; {dep.branch}</>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {dep.deployer}
                    {dep.timestamps.completed_at && (
                      <> &middot; {formatRelativeTime(dep.timestamps.completed_at)}</>
                    )}
                  </p>
                </div>
                {(dep.status === 'pending' || dep.status === 'running') && (
                  <button
                    onClick={() => handleAbort(dep.identifier)}
                    disabled={actionLoading === dep.identifier}
                    className={`text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors${actionLoading === dep.identifier ? ' opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading === dep.identifier ? '...' : 'Abort'}
                  </button>
                )}
                {dep.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(dep.identifier)}
                    disabled={actionLoading === dep.identifier}
                    className={`text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors${actionLoading === dep.identifier ? ' opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading === dep.identifier ? '...' : 'Retry'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {actionError && (
        <p className="mx-4 mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">{actionError}</p>
      )}
    </div>
  );
}

function ServerRow({ server }: { server: Server }) {
  return (
    <li className="px-4 py-2 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{server.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {PROTOCOL_LABELS[server.protocol_type] ?? server.protocol_type}
          {server.environment && ` / ${server.environment}`}
        </p>
      </div>
      {typeof server.last_revision === 'string' && server.last_revision && (
        <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          {server.last_revision.slice(0, 7)}
        </code>
      )}
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
        {title}
      </h3>
      {children}
    </div>
  );
}
