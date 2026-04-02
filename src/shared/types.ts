export interface Credentials {
  email: string;
  apiKey: string;
  accountSubdomain: string;
}

export interface Project {
  name: string;
  permalink: string;
  identifier: string;
  public_key: string;
  repository: Repository | null;
  last_deployed_at: string | null;
  auto_deploy_url: string;
  zone: { identifier: string; hostname: string } | null;
  starred: boolean;
}

export interface Repository {
  scm_type: 'git' | 'subversion' | 'mercurial';
  url: string;
  port: number | null;
  branch: string;
  hosting_service: {
    name: string;
    url: string;
    tree_url: string;
    commits_url: string;
  } | null;
}

export interface Server {
  id: number;
  identifier: string;
  name: string;
  protocol_type: string;
  server_path: string;
  last_revision: string | null;
  preferred_branch: string;
  branch: string | null;
  auto_deploy: boolean;
  environment: string | null;
  server_group_identifier: string | null;
  enabled: boolean;
  hostname: string | null;
  connection_error_message: string | null;
}

export interface ServerGroup {
  identifier: string;
  name: string;
  branch: string;
  auto_deploy: boolean;
  transfer_order: 'parallel' | 'sequential';
}

export interface Deployment {
  identifier: string;
  status: DeploymentStatus;
  branch: string | null;
  start_revision: string | null;
  end_revision: string | null;
  deployer: string;
  timestamps: {
    queued_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration: number | null;
  };
  servers: DeploymentServer[];
  project: {
    name: string;
    permalink: string;
  };
  archived: boolean;
  legacy: boolean;
  deferred: boolean;
}

export interface DeploymentServer {
  identifier: string;
  name: string;
  status: DeploymentStatus;
}

export type DeploymentStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'preview_pending';

export interface CreateDeploymentParams {
  parent_identifier: string;
  start_revision: string;
  end_revision: string;
  branch: string;
  mode?: 'queue' | 'preview';
  copy_config_files?: number;
}

export interface PaginatedResponse<T> {
  pagination: {
    total: number;
    count: number;
    per_page: number;
    page: number;
  };
  records: T[];
}

export interface Branch {
  name: string;
}

export interface ApiError {
  error: string;
  message?: string;
  upgrade_url?: string;
}

export interface ActivityEvent {
  event: string;
  project: { identifier: string; name: string; permalink: string };
  properties: Record<string, unknown>;
  user: string;
  created_at: string;
}

export interface DeployStats {
  total_deployments: number;
  total_deployments_delta: number;
  success_rate: number | null;
  success_rate_delta: number | null;
  avg_duration: string;
  active_servers: number;
}

export interface ActivityWithStatsResponse {
  events: ActivityEvent[];
  stats: DeployStats;
}

export type AppView =
  | { type: 'login' }
  | { type: 'dashboard' }
  | { type: 'project'; permalink: string }
  | { type: 'deploy'; permalink: string; branch?: string; revision?: string }
  | { type: 'settings' };
