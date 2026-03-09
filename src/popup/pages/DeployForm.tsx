import { useState, useEffect } from 'react';
import type { AppView, Server, ServerGroup } from '@/shared/types';
import { api, ApiAuthError } from '@/shared/api';
import { getCredentials } from '@/shared/storage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface DeployFormProps {
  permalink: string;
  branch?: string;
  revision?: string;
  onNavigate: (view: AppView) => void;
}

type DeployTarget = { type: 'server'; value: Server } | { type: 'group'; value: ServerGroup };

export default function DeployForm({ permalink, branch: initialBranch, revision: initialRevision, onNavigate }: DeployFormProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(initialBranch ?? '');
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [srvs, grps, branchList] = await Promise.all([
          api.listServers(permalink).catch((e) => { console.error('[DeployHQ] listServers error:', e); return [] as Server[]; }),
          api.listServerGroups(permalink).catch((e) => { console.error('[DeployHQ] listServerGroups error:', e); return [] as ServerGroup[]; }),
          api.listBranches(permalink).catch((e) => { console.error('[DeployHQ] listBranches error:', e); return [] as string[]; }),
        ]);
        console.log('[DeployHQ] DeployForm loaded:', { permalink, servers: srvs, groups: grps, branches: branchList });
        setServers(srvs);
        setGroups(grps);
        setBranches(branchList);

        // Auto-select first target and its branch
        if (grps.length > 0) {
          setSelectedTarget(`group:${grps[0].identifier}`);
          if (!initialBranch) {
            setSelectedBranch(grps[0].branch || branchList[0] || '');
          }
        } else if (srvs.length > 0) {
          setSelectedTarget(`server:${srvs[0].identifier}`);
          if (!initialBranch) {
            const serverBranch = srvs[0].preferred_branch || srvs[0].branch;
            setSelectedBranch(serverBranch || branchList[0] || '');
          }
        } else if (!initialBranch && branchList.length > 0) {
          setSelectedBranch(branchList[0]);
        }
      } catch (err) {
        if (err instanceof ApiAuthError) {
          onNavigate({ type: 'login' });
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load deploy options');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [permalink]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTargetChange = (value: string) => {
    setSelectedTarget(value);
    if (initialBranch) return;
    const [type, id] = value.split(':');
    if (type === 'server') {
      const server = servers.find((s) => s.identifier === id);
      const branch = server?.preferred_branch || server?.branch;
      if (branch) setSelectedBranch(branch);
    } else if (type === 'group') {
      const group = groups.find((g) => g.identifier === id);
      if (group?.branch) setSelectedBranch(group.branch);
    }
  };

  const getTarget = (): DeployTarget | null => {
    if (!selectedTarget) return null;
    const [type, id] = selectedTarget.split(':');
    if (type === 'group') {
      const group = groups.find((g) => g.identifier === id);
      return group ? { type: 'group', value: group } : null;
    }
    const server = servers.find((s) => s.identifier === id);
    return server ? { type: 'server', value: server } : null;
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeploying(true);

    try {
      const target = getTarget();
      if (!target) {
        setError('Please select a server or group');
        return;
      }

      const serverId = target.value.identifier;

      // Get latest revision for the branch
      const latest = await api.getLatestRevision(permalink, selectedBranch);
      const endRevision = initialRevision || latest.ref;

      // start_revision: use server's last deployed revision, or same as end for first deploy
      const startRevision = target.type === 'server'
        && typeof target.value.last_revision === 'string'
        && target.value.last_revision
          ? target.value.last_revision
          : endRevision;

      const result = await api.createDeployment(permalink, {
        parent_identifier: serverId,
        start_revision: startRevision,
        end_revision: endRevision,
        branch: selectedBranch,
        mode: 'queue',
        copy_config_files: 1,
      });

      setDeploymentId(result.identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading deploy options..." />;

  if (deploymentId) {
    const openDeploymentLogs = async () => {
      const creds = await getCredentials();
      if (creds) {
        chrome.tabs.create({
          url: `https://${creds.accountSubdomain}.deployhq.com/projects/${permalink}/deployments/${deploymentId}`,
        });
      }
    };

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">Deployment Queued</h3>
        <p className="text-xs text-gray-500 mb-4">Your deployment is being processed.</p>
        <button
          onClick={openDeploymentLogs}
          className="text-sm text-deployhq-600 hover:underline font-medium"
        >
          View Deployment Logs
        </button>
      </div>
    );
  }

  const noTargets = servers.length === 0 && groups.length === 0;

  return (
    <div className="p-4">
      <h2 className="text-sm font-bold text-gray-900 mb-4">New Deployment</h2>

      {noTargets ? (
        <ErrorMessage message="No servers or server groups configured for this project." />
      ) : (
        <form onSubmit={handleDeploy} className="space-y-4">
          {/* Target selection */}
          <div>
            <label htmlFor="target" className="block text-xs font-medium text-gray-700 mb-1">
              Deploy to
            </label>
            <select
              id="target"
              value={selectedTarget}
              onChange={(e) => handleTargetChange(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 bg-white"
            >
              <option value="">Select target...</option>
              {groups.length > 0 && (
                <optgroup label="Server Groups">
                  {groups.map((g) => (
                    <option key={g.identifier} value={`group:${g.identifier}`}>
                      {g.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {servers.length > 0 && (
                <optgroup label="Servers">
                  {servers.map((s) => (
                    <option key={s.identifier} value={`server:${s.identifier}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Branch selection */}
          <div>
            <label htmlFor="branch" className="block text-xs font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              id="branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 bg-white"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Revision (if provided from content script) */}
          {initialRevision && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Revision
              </label>
              <code className="block text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-lg font-mono">
                {initialRevision}
              </code>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={deploying || !selectedTarget}
            className="w-full bg-deployhq-600 hover:bg-deployhq-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Deploying...
              </>
            ) : (
              'Start Deployment'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
